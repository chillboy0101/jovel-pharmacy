import { PrismaClient } from "@prisma/client";

function readArgValue(name: string) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function norm(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  const prisma = new PrismaClient();

  const dryRun = hasFlag("--dry-run");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true, createdAt: true },
  });

  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const key = `${norm(p.name)}`;
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }

  const dupGroups = Array.from(groups.entries())
    .map(([key, items]) => ({ key, items }))
    .filter((g) => g.items.length > 1);

  const results: Array<{
    key: string;
    keepId: string;
    deleteIds: string[];
    mergedOrderItems: number;
    mergedReviews: number;
    deletedProducts: number;
  }> = [];

  for (const g of dupGroups) {
    const ids = g.items.map((i) => i.id);

    const counts = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        _count: {
          select: {
            orderItems: true,
            reviewItems: true,
          },
        },
        imageUrl: true,
        createdAt: true,
      },
    });

    const sorted = [...counts].sort((a, b) => {
      const aRefs = a._count.orderItems + a._count.reviewItems;
      const bRefs = b._count.orderItems + b._count.reviewItems;
      if (bRefs !== aRefs) return bRefs - aRefs;
      if (!!b.imageUrl !== !!a.imageUrl) return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const keep = sorted[0];
    const toDelete = sorted.slice(1).map((x) => x.id);

    let mergedOrderItems = 0;
    let mergedReviews = 0;
    let deletedProducts = 0;

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        const orderRes = await tx.orderItem.updateMany({
          where: { productId: { in: toDelete } },
          data: { productId: keep.id },
        });
        mergedOrderItems = orderRes.count;

        const reviewRes = await tx.review.updateMany({
          where: { productId: { in: toDelete } },
          data: { productId: keep.id },
        });
        mergedReviews = reviewRes.count;

        const delRes = await tx.product.deleteMany({
          where: { id: { in: toDelete } },
        });
        deletedProducts = delRes.count;
      });
    }

    results.push({
      key: g.key,
      keepId: keep.id,
      deleteIds: toDelete,
      mergedOrderItems,
      mergedReviews,
      deletedProducts,
    });
  }

  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        duplicateGroups: dupGroups.length,
        dryRun,
        results,
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
