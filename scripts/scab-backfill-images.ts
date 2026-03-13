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

function productIdFromUrl(url: string) {
  const h = crypto.createHash("sha1").update(url).digest("hex");
  return `scab_${h.slice(0, 24)}`;
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

  const data = new Blob([new Uint8Array(buf)], { type: mime });
  const blob = await put(key, data, {
    access: "public",
    allowOverwrite: true,
    ...(token ? { token } : {}),
  });

  return blob.url;
}

async function uploadBufferToBlob(params: {
  buf: Buffer;
  sha256: string;
  preferredName: string;
  folder: string;
  ext: string;
  mime: string;
  token?: string;
}) {
  const { buf, sha256, preferredName, folder, ext, mime, token } = params;

  const fileNameBase = preferredName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "image";

  const key = `${folder}/${sha256}-${fileNameBase}${ext}`;
  const data = new Blob([new Uint8Array(buf)], { type: mime });
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

  const blobFolder = readArgValue("--blob-folder") || "products";
  const limitArg = readArgValue("--limit");
  const limit = limitArg ? parseInt(limitArg, 10) : null;

  const dryRun = hasFlag("--dry-run");

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
  const scabProducts = parsed as ScabProduct[];

  const byId = new Map<string, ScabProduct>();
  for (const p of scabProducts) {
    byId.set(productIdFromUrl(p.url), p);
  }

  const prisma = new PrismaClient();

  const missing = await prisma.product.findMany({
    where: {
      brand: "SCAB",
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true, name: true, imageUrl: true },
  });

  let processed = 0;
  let updated = 0;
  let skippedNoLocalImage = 0;
  let remoteFetched = 0;
  let notInJson = 0;
  let failed = 0;

  for (const prod of missing) {
    if (limit != null && processed >= limit) break;
    processed++;

    const src = byId.get(prod.id);
    if (!src) {
      notInJson++;
      continue;
    }

    const img = (src.downloadedImages || []).find(
      (i) =>
        i.sourceUrl &&
        !i.sourceUrl.startsWith("data:image/svg+xml") &&
        fs.existsSync(i.filePath),
    );

    const remoteImgUrl = (src.imageUrls || []).find(
      (u) => typeof u === "string" && u.startsWith("http"),
    );

    try {
      let url: string;

      if (img) {
        url = dryRun
          ? `dry-run://${img.sha256}`
          : await uploadImageToBlob({
              localPath: img.filePath,
              sha256: img.sha256,
              preferredName: src.name,
              folder: blobFolder,
              token: blobToken,
            });
      } else if (remoteImgUrl) {
        if (dryRun) {
          url = `dry-run://remote/${prod.id}`;
        } else {
          const { buf, sha256 } = await downloadRemoteImage(remoteImgUrl);
          const ext = extFromUrl(remoteImgUrl);
          const mime = guessMimeFromExt(ext);
          url = await uploadBufferToBlob({
            buf,
            sha256,
            preferredName: src.name,
            folder: blobFolder,
            ext,
            mime,
            token: blobToken,
          });
          remoteFetched++;
        }
      } else {
        skippedNoLocalImage++;
        console.warn(`[backfill] no image available for ${prod.id} ${prod.name}`);
        continue;
      }

      if (!dryRun) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { imageUrl: url },
        });
      }
      updated++;
    } catch (err) {
      console.error(`[backfill] failed for ${prod.id} ${prod.name}`, err);
      failed++;
    }
  }

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        inputPath,
        missingCount: missing.length,
        processed,
        updated,
        skippedNoLocalImage,
        remoteFetched,
        notInJson,
        failed,
        dryRun,
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
