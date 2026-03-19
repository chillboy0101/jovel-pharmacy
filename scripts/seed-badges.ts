import { PrismaClient } from "@prisma/client";

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function readArgValue(name: string) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : null;
}

function readIntArg(name: string, fallback: number) {
  const v = readArgValue(name);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function isBlockedBlobUrl(url: string | null | undefined) {
  if (!url) return true;
  return url.includes("public.blob.vercel-storage.com");
}

async function main() {
  const prisma = new PrismaClient();

  const saleCount = readIntArg("--sale", 12);
  const bestsellerCount = readIntArg("--bestseller", 12);
  const newCount = readIntArg("--new", 12);

  const resetSale = hasFlag("--reset-sale");
  const resetBestseller = hasFlag("--reset-bestseller");
  const resetNew = hasFlag("--reset-new");
  const resetAll = hasFlag("--reset");

  const includeAllBrands = hasFlag("--all-brands");
  const brand = readArgValue("--brand") || "SCAB";

  const whereBrand = includeAllBrands
    ? {}
    : brand.toUpperCase() === "SCAB"
      ? { id: { startsWith: "scab_" } }
      : {};

  if (resetAll || resetSale || resetBestseller || resetNew) {
    const badgesToReset: string[] = [];
    if (resetAll || resetSale) badgesToReset.push("sale");
    if (resetAll || resetBestseller) badgesToReset.push("bestseller");
    if (resetAll || resetNew) badgesToReset.push("new");
    if (badgesToReset.length) {
      await prisma.product.updateMany({
        where: {
          ...whereBrand,
          badge: { in: badgesToReset },
        },
        data: { badge: null },
      });
    }
  }

  const storefrontWhere = {
    ...whereBrand,
    OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
    badge: null as null,
    AND: [
      { imageUrl: { not: null } },
      { imageUrl: { not: "" } },
      { imageUrl: { not: "null" } },
      { NOT: { imageUrl: { contains: "public.blob.vercel-storage.com" } } },
    ],
  };

  const [saleCandidates, bestsellerCandidates, newCandidates] = await Promise.all([
    prisma.product.findMany({
      where: storefrontWhere,
      select: { id: true },
      orderBy: [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }],
      take: Math.max(saleCount * 3, 1),
    }),
    prisma.product.findMany({
      where: storefrontWhere,
      select: { id: true },
      orderBy: [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }],
      take: Math.max(bestsellerCount * 3, 1),
    }),
    prisma.product.findMany({
      where: storefrontWhere,
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { rating: "desc" }],
      take: Math.max(newCount * 3, 1),
    }),
  ]);

  const used = new Set<string>();

  function pickUnique(ids: Array<{ id: string }>, count: number) {
    const out: string[] = [];
    for (const p of ids) {
      if (out.length >= count) break;
      if (used.has(p.id)) continue;
      used.add(p.id);
      out.push(p.id);
    }
    return out;
  }

  const saleIds = pickUnique(saleCandidates, saleCount);
  const bestsellerIds = pickUnique(bestsellerCandidates, bestsellerCount);
  const newIds = pickUnique(newCandidates, newCount);

  const newWithUrls = await prisma.product.findMany({
    where: { id: { in: newIds } },
    select: { id: true, imageUrl: true },
  });
  const badNewIds = newWithUrls.filter((p) => isBlockedBlobUrl(p.imageUrl)).map((p) => p.id);

  const [saleRes, bestRes, newRes] = await Promise.all([
    saleIds.length
      ? prisma.product.updateMany({ where: { id: { in: saleIds } }, data: { badge: "sale" } })
      : Promise.resolve({ count: 0 }),
    bestsellerIds.length
      ? prisma.product.updateMany({
          where: { id: { in: bestsellerIds } },
          data: { badge: "bestseller" },
        })
      : Promise.resolve({ count: 0 }),
    newIds.length
      ? prisma.product.updateMany({
          where: { id: { in: newIds.filter((id) => !badNewIds.includes(id)) } },
          data: { badge: "new" },
        })
      : Promise.resolve({ count: 0 }),
  ]);

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        brandFilter: includeAllBrands ? "*" : brand,
        requested: { sale: saleCount, bestseller: bestsellerCount, new: newCount },
        updated: { sale: saleRes.count, bestseller: bestRes.count, new: newRes.count },
        skippedNewDueToBlockedImage: badNewIds.length,
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
