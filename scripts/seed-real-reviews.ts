import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding real reviews...");

  const passwordHash = await bcrypt.hash("customer123", 12);

  const products = await prisma.product.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' }
  });

  if (products.length === 0) {
    console.log("No products found to review.");
    return;
  }

  const reviewers = [
    { name: "Ama Serwaa", email: "ama@example.com" },
    { name: "Kofi Mensah", email: "kofi@example.com" },
    { name: "Akosua Boateng", email: "akosua@example.com" },
    { name: "Kwame Owusu", email: "kwame@example.com" },
    { name: "Abena Appiah", email: "abena@example.com" },
    { name: "Ekow Taylor", email: "ekow@example.com" },
    { name: "Maame Araba", email: "maame@example.com" },
  ];

  const reviewTexts = [
    "Excellent service and fast delivery. Highly recommended!",
    "The product arrived in perfect condition. Very satisfied.",
    "Great price for the quality. Will definitely buy again.",
    "Very helpful pharmacists and quick response to my questions.",
    "Authentic products and easy to navigate website.",
    "I've been looking for this everywhere, glad Jovel had it.",
    "Reliable and professional service every time."
  ];

  const touchedProductIds = new Set<string>();

  for (let i = 0; i < reviewers.length; i++) {
    const reviewer = reviewers[i];
    
    const user = await prisma.user.upsert({
      where: { email: reviewer.email },
      update: {
        name: reviewer.name,
        role: "USER",
        password: passwordHash,
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      create: {
        email: reviewer.email,
        name: reviewer.name,
        password: passwordHash,
        role: "USER",
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      select: { id: true },
    });

    const product = products[i % products.length];
    touchedProductIds.add(product.id);

    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
      },
      select: { id: true },
    });

    if (existingReview) {
      await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: 5,
          comment: reviewTexts[i % reviewTexts.length],
        },
      });
    } else {
      await prisma.review.create({
        data: {
          userId: user.id,
          productId: product.id,
          rating: 5,
          comment: reviewTexts[i % reviewTexts.length],
        },
      });
    }
  }

  for (const productId of touchedProductIds) {
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviews: agg._count.rating,
      },
    });
  }

  console.log("Real reviews seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
