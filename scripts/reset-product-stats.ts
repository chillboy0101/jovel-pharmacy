import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting product stats (rating, reviews, badges)...");

  // Reset all products to 0 rating/reviews and clear existing badges
  const result = await prisma.product.updateMany({
    data: {
      rating: 0,
      reviews: 0,
      badge: null,
    },
  });

  console.log(`Reset ${result.count} products.`);

  // Randomly assign some ratings and reviews to simulate "real" but clean data
  // Only for a subset to make it look natural
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  
  console.log("Assigning random ratings/reviews and badges...");
  
  for (const p of allProducts) {
    const shouldHaveReview = Math.random() > 0.3;
    if (shouldHaveReview) {
      const rating = 4 + Math.random(); // 4.0 to 5.0
      const reviews = Math.floor(Math.random() * 50) + 1;
      
      let badge = null;
      const rand = Math.random();
      if (rand > 0.9) badge = "bestseller";
      else if (rand > 0.8) badge = "new";
      else if (rand > 0.7) badge = "sale";

      await prisma.product.update({
        where: { id: p.id },
        data: {
          rating: Number(rating.toFixed(1)),
          reviews,
          badge,
        },
      });
    }
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
