import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const missingImageWhere: Prisma.ProductWhereInput = {
    OR: [{ imageUrl: null }, { imageUrl: "" }, { imageUrl: "null" }],
  };

  const candidates = await prisma.product.findMany({
    where: missingImageWhere,
    select: { id: true, name: true },
  });

  const deletable = await prisma.product.findMany({
    where: {
      ...missingImageWhere,
      orderItems: { none: {} },
      reviewItems: { none: {} },
    } satisfies Prisma.ProductWhereInput,
    select: { id: true },
  });

  const deletableIds = deletable.map((p) => p.id);

  const deletedProducts = deletableIds.length
    ? await prisma.product.deleteMany({
        where: { id: { in: deletableIds } },
      })
    : { count: 0 };

  const emptyCategories = await prisma.category.findMany({
    where: { products: { none: {} } },
    select: { id: true },
  });

  const emptyCategoryIds = emptyCategories.map((c) => c.id);

  const deletedCategories = emptyCategoryIds.length
    ? await prisma.category.deleteMany({
        where: { id: { in: emptyCategoryIds } },
      })
    : { count: 0 };

  console.log(
    JSON.stringify(
      {
        emojiOnlyCandidates: candidates.length,
        emojiOnlyDeletable: deletableIds.length,
        emojiOnlyDeleted: deletedProducts.count,
        emojiOnlySkipped: Math.max(0, candidates.length - deletedProducts.count),
        emptyCategoriesDeleted: deletedCategories.count,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
