import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureSeedReviewerUser() {
  const email = "seed-reviews@jovelpharmacy.com";
  const name = "Jovel Pharmacy";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "USER",
      emailVerified: new Date(),
      verifyToken: null,
      verifyTokenExpiry: null,
    },
    create: {
      email,
      name,
      password: "__seed_only__",
      role: "USER",
      emailVerified: new Date(),
      verifyToken: null,
      verifyTokenExpiry: null,
    },
    select: { id: true },
  });

  return user.id;
}

function commentForProduct(productName: string) {
  return `Purchased from Jovel Pharmacy. ${productName} arrived well packaged and as described.`;
}

async function main() {
  const seedUserId = await ensureSeedReviewerUser();

  const productsMissingReviews = await prisma.product.findMany({
    where: {
      reviewItems: { none: {} },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let updatedAggregates = 0;

  for (const p of productsMissingReviews) {
    await prisma.review.create({
      data: {
        productId: p.id,
        userId: seedUserId,
        rating: 5,
        comment: commentForProduct(p.name),
        verifiedPurchase: false,
      },
    });
    created++;

    const agg = await prisma.review.aggregate({
      where: { productId: p.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: p.id },
      data: {
        rating: agg._avg.rating ?? 0,
        reviews: agg._count.rating,
      },
    });

    updatedAggregates++;
  }

  // Also repair any mismatched aggregates (counts/avg) for products that *do* have reviews.
  // This keeps the shop list, product header, and /api/reviews aggregation consistent.
  const productsWithReviews = await prisma.product.findMany({
    where: { reviewItems: { some: {} } },
    select: { id: true },
  });

  let repaired = 0;
  for (const p of productsWithReviews) {
    const agg = await prisma.review.aggregate({
      where: { productId: p.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const nextRating = agg._avg.rating ?? 0;
    const nextReviews = agg._count.rating;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        rating: nextRating,
        reviews: nextReviews,
      },
    });

    repaired++;
  }

  console.log(
    JSON.stringify(
      {
        productsMissingReviews: productsMissingReviews.length,
        reviewsCreated: created,
        aggregatesUpdatedForMissing: updatedAggregates,
        aggregatesRepairedForExisting: repaired,
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
