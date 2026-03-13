import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding real reviews...");

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

  for (let i = 0; i < reviewers.length; i++) {
    const reviewer = reviewers[i];
    
    // Check if user exists first
    let user = await prisma.user.findUnique({
      where: { email: reviewer.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: reviewer.email,
          name: reviewer.name,
          password: "placeholder_password",
          role: "USER"
        }
      });
    }

    const product = products[i % products.length];

    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id
        }
      },
      update: {
        rating: 5,
        comment: reviewTexts[i % reviewTexts.length]
      },
      create: {
        userId: user.id,
        productId: product.id,
        rating: 5,
        comment: reviewTexts[i % reviewTexts.length]
      }
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
