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

  const missingImages = await prisma.product.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true, name: true, imageUrl: true, sourceSlug: true, sourceUrl: true },
    orderBy: { name: "asc" },
  });

  const all = await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true, sourceSlug: true, sourceUrl: true },
  });

  const groups = new Map<string, typeof all>();
  for (const p of all) {
    const key = norm(p.name);
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
        totalProducts: all.length,
        missingImageCount: missingImages.length,
        duplicateGroups: dupGroups.length,
        sampleMissingImages: missingImages.slice(0, limit),
        sampleDuplicates: dupGroups.slice(0, Math.min(20, limit)).map((g) => ({
          key: g.key,
          count: g.items.length,
          items: g.items.map((p) => ({ id: p.id, hasImage: !!p.imageUrl })),
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
