import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import cryptoNode from "node:crypto";

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

function slugFromProductUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "product");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

function productIdFromSource(url: string) {
  const slug = slugFromProductUrl(url);
  if (slug) return slug;
  return productIdFromUrl(url);
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

function extFromUrl(url: string) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname);
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

async function downloadRemoteImage(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "JovelPharmacy-Bot/1.0 (inventory-sync; contact: jovelpharmacy@example.com)",
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return { buf, sha256 };
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3) {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String((err as any)?.message ?? err);
      const code = (err as any)?.code;
      const isTransient = code === "P1017" || msg.toLowerCase().includes("server has closed the connection");
      if (!isTransient || attempt >= maxRetries) break;
      const backoffMs = 250 * Math.pow(2, attempt);
      console.warn(`[retry] ${label} (attempt ${attempt + 1}/${maxRetries + 1}) after ${backoffMs}ms: ${code ?? ""} ${msg}`);
      await new Promise((r) => setTimeout(r, backoffMs));
      attempt++;
    }
  }
  throw lastErr;
}

async function uploadToCloudinary(params: {
  localPath: string;
  folder: string;
}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET");
  }

  const buf = await fs.promises.readFile(params.localPath);
  const mime = guessMimeFromExt(params.localPath);
  const file = new Blob([buf], { type: mime });

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${params.folder}&timestamp=${timestamp}`;
  const signature = cryptoNode
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const up = new FormData();
  up.append("file", file);
  up.append("folder", params.folder);
  up.append("timestamp", String(timestamp));
  up.append("api_key", apiKey);
  up.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: up });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return (data.secure_url || data.url) as string;
}

async function uploadBufferToCloudinary(params: {
  buf: Buffer;
  mime: string;
  folder: string;
}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET");
  }

  const file = new Blob([new Uint8Array(params.buf)], { type: params.mime });

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${params.folder}&timestamp=${timestamp}`;
  const signature = cryptoNode
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const up = new FormData();
  up.append("file", file);
  up.append("folder", params.folder);
  up.append("timestamp", String(timestamp));
  up.append("api_key", apiKey);
  up.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: up });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return (data.secure_url || data.url) as string;
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
  const cloudinaryFolder = readArgValue("--cloudinary-folder") || "products/scab";

  const raw = await fs.promises.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array");

  const products = parsed as ScabProduct[];

  const prisma = new PrismaClient();
  await prisma.$connect();

  const existingCategories = await withRetry(
    () => prisma.category.findMany({ select: { id: true, name: true } }),
    "category.findMany",
  );
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
      const slug = slugFromProductUrl(p.url) || productIdFromUrl(p.url);
      const id = productIdFromSource(p.url);
      const resolvedExisting = dryRun
        ? null
        : await withRetry(
            () =>
              prisma.product.findUnique({
                where: { sourceSlug: slug },
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
              }),
            "product.findUnique(sourceSlug)",
          );

      if (resolvedExisting && !updateExisting) {
        skippedExisting++;
        continue;
      }

      const categoryName = (p.categories && p.categories[0]) || "Uncategorized";
      const categoryNameKey = categoryName.toLowerCase();
      let categoryId: string | undefined = categoryNameToId.get(categoryNameKey);

      if (!categoryId) {
        categoryId = slugifyCategory(categoryName) || "uncategorized";
        const cid = categoryId;

        if (!dryRun) {
          await withRetry(
            () =>
              prisma.category.upsert({
                where: { id: cid },
                create: {
                  id: cid,
                  name: categoryName,
                  description: categoryName,
                  icon: "Sparkles",
                },
                update: {
                  name: categoryName,
                },
              }),
            "category.upsert",
          );
        }

        categoryNameToId.set(categoryNameKey, cid);
      }

      if (!categoryId) {
        throw new Error(`Failed to resolve categoryId for category: ${categoryName}`);
      }

      // Use existing Cloudinary URLs if available in products.json, fallback to valid remote URL
      let imageUrl: string | null = (resolvedExisting?.imageUrl as string | null) ?? null;
      
      if (!imageUrl) {
        // Find first valid non-SVG image URL from the source data
        const validUrl = (p.imageUrls || []).find(
          (u) => typeof u === "string" && u.startsWith("http") && !u.includes("scabpharmacy.com")
        );
        
        if (validUrl) {
          imageUrl = (validUrl as string);
        } else {
          // If no Cloudinary URL, fall back to the first available non-SVG URL
          const fallbackUrl = (p.imageUrls || []).find(
            (u) => typeof u === "string" && u.startsWith("http") && !u.includes("data:image/svg+xml")
          );
          if (fallbackUrl) imageUrl = (fallbackUrl as string);
        }
      }

      const data = {
        id,
        name: p.name,
        categoryId,
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
        sourceSlug: slug,
        sourceUrl: p.url,
      };

      if (dryRun) {
        created++;
        continue;
      }

      if (!resolvedExisting) {
        await withRetry(() => prisma.product.create({ data }), "product.create");
        created++;
      } else {
        await withRetry(
          () =>
            prisma.product.update({
              where: { id: resolvedExisting.id },
              data: {
                name: data.name,
                categoryId: data.categoryId,
                originalPrice: data.originalPrice,
                discountPercent: data.discountPercent,
                description: data.description,
                dosage: data.dosage,
                emoji: data.emoji,
                ...(imageUrl ? { imageUrl: data.imageUrl } : {}),
                stock: resolvedExisting.stock,
                badge: resolvedExisting.badge,
                rating: resolvedExisting.rating,
                reviews: resolvedExisting.reviews,
                costPrice: resolvedExisting.costPrice,
                expiryDate: resolvedExisting.expiryDate,
                sourceSlug: data.sourceSlug,
                sourceUrl: data.sourceUrl,
              },
            }),
          "product.update",
        );
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
