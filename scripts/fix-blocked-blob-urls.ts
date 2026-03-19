import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

type ScabProduct = {
  source: "scabpharmacy.com";
  url: string;
  name: string;
  imageUrls: string[];
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

function pickRemoteImageUrl(p: ScabProduct) {
  const url = (p.imageUrls || []).find((u) => typeof u === "string" && u.startsWith("http"));
  return url ?? null;
}

function isMissingImageUrl(url: string | null | undefined) {
  return !url || url === "" || url === "null";
}

function isBlockedBlobUrl(url: string | null | undefined) {
  if (!url) return false;
  return url.includes("public.blob.vercel-storage.com");
}

async function main() {
  const inputArg = readArgValue("--input");
  const inputPath = inputArg
    ? path.resolve(process.cwd(), inputArg)
    : path.resolve(process.cwd(), "P&E", "scab", "products.json");

  const categoryId = readArgValue("--category");
  const brand = readArgValue("--brand") || "SCAB";

  const dryRun = hasFlag("--dry-run");

  const fixMissing = !hasFlag("--blocked-only");
  const fixBlocked = !hasFlag("--missing-only");

  const raw = await fs.promises.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array");
  const scabProducts = parsed as ScabProduct[];

  const byId = new Map<string, ScabProduct>();
  for (const p of scabProducts) {
    if (p?.url) byId.set(productIdFromUrl(p.url), p);
  }

  const prisma = new PrismaClient();

  const baseWhere: any =
    brand.toUpperCase() === "SCAB" ? { id: { startsWith: "scab_" } } : {};
  if (categoryId) baseWhere.categoryId = categoryId;

  const candidates = await prisma.product.findMany({
    where: {
      ...baseWhere,
      OR: [
        ...(fixMissing ? [{ imageUrl: null }, { imageUrl: "" }, { imageUrl: "null" }] : []),
        ...(fixBlocked ? [{ imageUrl: { contains: "public.blob.vercel-storage.com" } }] : []),
      ],
    },
    select: { id: true, name: true, imageUrl: true, categoryId: true },
  });

  let updated = 0;
  let missingMapping = 0;
  let missingRemoteUrl = 0;
  let skippedNotApplicable = 0;

  const perCategory = new Map<
    string,
    { total: number; missing: number; blocked: number; updated: number; missingMapping: number; missingRemoteUrl: number }
  >();

  function ensureCat(catId: string) {
    const existing = perCategory.get(catId);
    if (existing) return existing;
    const init = { total: 0, missing: 0, blocked: 0, updated: 0, missingMapping: 0, missingRemoteUrl: 0 };
    perCategory.set(catId, init);
    return init;
  }

  for (const prod of candidates) {
    const stats = ensureCat(prod.categoryId);
    stats.total++;
    const missing = isMissingImageUrl(prod.imageUrl);
    const blocked = isBlockedBlobUrl(prod.imageUrl);
    if ((missing && !fixMissing) || (blocked && !fixBlocked) || (!missing && !blocked)) {
      skippedNotApplicable++;
      continue;
    }

    if (missing) stats.missing++;
    if (blocked) stats.blocked++;

    const src = byId.get(prod.id);
    if (!src) {
      missingMapping++;
      stats.missingMapping++;
      continue;
    }
    const remoteUrl = pickRemoteImageUrl(src);
    if (!remoteUrl) {
      missingRemoteUrl++;
      stats.missingRemoteUrl++;
      continue;
    }

    if (!dryRun) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { imageUrl: remoteUrl },
      });
    }
    updated++;
    stats.updated++;
  }

  await prisma.$disconnect();

  const perCategorySummary = Array.from(perCategory.entries())
    .map(([catId, s]) => ({ categoryId: catId, ...s }))
    .sort((a, b) => b.updated - a.updated || b.blocked - a.blocked || b.missing - a.missing);

  console.log(
    JSON.stringify(
      {
        brand,
        categoryId: categoryId ?? null,
        dryRun,
        fixMissing,
        fixBlocked,
        candidates: candidates.length,
        updated,
        skippedNotApplicable,
        missingMapping,
        missingRemoteUrl,
        perCategorySummary,
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
