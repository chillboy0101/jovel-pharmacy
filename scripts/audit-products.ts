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

function norm(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  const prisma = new PrismaClient();

  const limitArg = readArgValue("--limit");
  const limit = limitArg ? parseInt(limitArg, 10) : 50;

  const includeAllBrands = hasFlag("--all-brands");
  const brand = readArgValue("--brand") || "SCAB";

  const whereBrand = includeAllBrands ? {} : { brand };

  const missingImages = await prisma.product.findMany({
    where: {
      ...whereBrand,
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true, name: true, brand: true, price: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  const all = await prisma.product.findMany({
    where: whereBrand,
    select: { id: true, name: true, brand: true, price: true, imageUrl: true },
  });

  const groups = new Map<string, typeof all>();
  for (const p of all) {
    const key = `${norm(p.brand)}::${norm(p.name)}`;
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }

  const dupGroups = Array.from(groups.entries())
    .map(([key, items]) => ({ key, items }))
    .filter((g) => g.items.length > 1)
    .sort((a, b) => b.items.length - a.items.length);

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        brandFilter: includeAllBrands ? "*" : brand,
        totalProducts: all.length,
        missingImageCount: missingImages.length,
        duplicateGroups: dupGroups.length,
        sampleMissingImages: missingImages.slice(0, limit),
        sampleDuplicates: dupGroups.slice(0, Math.min(20, limit)).map((g) => ({
          key: g.key,
          count: g.items.length,
          items: g.items.map((p) => ({ id: p.id, price: p.price, hasImage: !!p.imageUrl })),
        })),
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
