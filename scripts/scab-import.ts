import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

type ScabProduct = {
  source: "scabpharmacy.com";
  url: string;
  name: string;
  priceText: string | null;
  imageUrls: string[];
  descriptionText: string | null;
  sku: string | null;
  categories: string[];
  downloadedImages: Array<{ sourceUrl: string; filePath: string; sha256: string }>;
};

function readArgValue(name: string) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function slugifyCategory(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function productIdFromUrl(url: string) {
  const h = crypto.createHash("sha1").update(url).digest("hex");
  return `scab_${h.slice(0, 24)}`;
}

function parseFirstPriceGhs(priceText: string | null) {
  if (!priceText) return null;
  const cleaned = priceText.replace(/\s+/g, " ");
  const m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) ? v : null;
}

function guessEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("syrup") || n.includes("suspension")) return "🧪";
  if (n.includes("cream") || n.includes("ointment") || n.includes("gel")) return "🧴";
  if (n.includes("injection") || n.includes("inj")) return "💉";
  if (n.includes("drops")) return "💧";
  if (n.includes("spray")) return "💨";
  return "💊";
}

function guessMimeFromExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

async function uploadImageToBlob(params: {
  localPath: string;
  sha256: string;
  preferredName: string;
  folder: string;
  token?: string;
}) {
  const { localPath, sha256, preferredName, folder, token } = params;
  const buf = await fs.promises.readFile(localPath);
  const mime = guessMimeFromExt(localPath);
  const fileNameBase = preferredName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "image";
  const ext = path.extname(localPath) || ".jpg";
  const key = `${folder}/${sha256}-${fileNameBase}${ext}`;

  const data = new Blob([buf], { type: mime });
  const blob = await put(key, data, {
    access: "public",
    allowOverwrite: true,
    ...(token ? { token } : {}),
  });

  return blob.url;
}

async function main() {
  const inputArg = readArgValue("--input");
  const inputPath = inputArg
    ? path.resolve(process.cwd(), inputArg)
    : path.resolve(process.cwd(), "P&E", "scab", "products.json");

  const limitArg = readArgValue("--limit");
  const limit = limitArg ? parseInt(limitArg, 10) : null;

  const dryRun = hasFlag("--dry-run");
  const updateExisting = hasFlag("--update-existing");
  const blobFolder = readArgValue("--blob-folder") || "products";

  const blobToken =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
    undefined;

  if (!dryRun && !blobToken) {
    throw new Error(
      "Missing BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_READ_WRITE_TOKEN). Required to upload images to Vercel Blob.",
    );
  }

  const raw = await fs.promises.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array");

  const products = parsed as ScabProduct[];

  const prisma = new PrismaClient();

  const existingCategories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryNameToId = new Map<string, string>(
    existingCategories.map((c) => [c.name.toLowerCase(), c.id]),
  );

  let processed = 0;
  let created = 0;
  let updated = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const p of products) {
    if (limit != null && processed >= limit) break;
    processed++;

    try {
      const price = parseFirstPriceGhs(p.priceText);
      if (!price || price <= 0) {
        failed++;
        continue;
      }

      const id = productIdFromUrl(p.url);
      const existing = dryRun
        ? null
        : await prisma.product.findUnique({
            where: { id },
            select: {
              id: true,
              imageUrl: true,
              stock: true,
              badge: true,
              rating: true,
              reviews: true,
              costPrice: true,
              expiryDate: true,
            },
          });

      if (existing && !updateExisting) {
        skippedExisting++;
        continue;
      }

      const categoryName = (p.categories && p.categories[0]) || "Uncategorized";
      const categoryNameKey = categoryName.toLowerCase();
      let categoryId = categoryNameToId.get(categoryNameKey);

      if (!categoryId) {
        categoryId = slugifyCategory(categoryName) || "uncategorized";

        if (!dryRun) {
          await prisma.category.upsert({
            where: { id: categoryId },
            create: {
              id: categoryId,
              name: categoryName,
              description: categoryName,
              icon: "Sparkles",
            },
            update: {
              name: categoryName,
            },
          });
        }

        categoryNameToId.set(categoryNameKey, categoryId);
      }

      let imageUrl: string | undefined;
      const shouldUploadImage = !existing?.imageUrl;
      const img = shouldUploadImage
        ? (p.downloadedImages || []).find(
            (i) =>
              i.sourceUrl &&
              !i.sourceUrl.startsWith("data:image/svg+xml") &&
              fs.existsSync(i.filePath),
          )
        : null;

      if (img) {
        if (!dryRun) {
          imageUrl = await uploadImageToBlob({
            localPath: img.filePath,
            sha256: img.sha256,
            preferredName: p.name,
            folder: blobFolder,
            token: blobToken,
          });
        } else {
          imageUrl = `dry-run://${img.sha256}`;
        }
      }

      const data = {
        id,
        name: p.name,
        brand: "SCAB",
        categoryId,
        price,
        originalPrice: null as number | null,
        discountPercent: 0,
        description: p.descriptionText || p.name,
        dosage: null as string | null,
        rating: 0,
        reviews: 0,
        stock: 10,
        badge: null as string | null,
        emoji: guessEmoji(p.name),
        imageUrl: imageUrl ?? null,
        costPrice: 0,
        expiryDate: null as Date | null,
      };

      if (dryRun) {
        created++;
        continue;
      }

      if (!existing) {
        await prisma.product.create({ data });
        created++;
      } else {
        await prisma.product.update({
          where: { id },
          data: {
            name: data.name,
            brand: data.brand,
            categoryId: data.categoryId,
            price: data.price,
            originalPrice: data.originalPrice,
            discountPercent: data.discountPercent,
            description: data.description,
            dosage: data.dosage,
            emoji: data.emoji,
            ...(imageUrl ? { imageUrl: data.imageUrl } : {}),
            stock: existing.stock,
            badge: existing.badge,
            rating: existing.rating,
            reviews: existing.reviews,
            costPrice: existing.costPrice,
            expiryDate: existing.expiryDate,
          },
        });
        updated++;
      }
    } catch (err) {
      console.error(`[import] failed for ${p.url}`, err);
      failed++;
    }
  }

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        inputPath,
        processed,
        created,
        updated,
        skippedExisting,
        failed,
        dryRun,
        updateExisting,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
