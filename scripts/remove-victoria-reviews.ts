import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Removing reviews by Victoria Oluwakemi Akai Quartey...");

  // Find the user first
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: "Victoria Oluwakemi Akai Quartey",
        mode: "insensitive"
      }
    }
  });

  if (user) {
    const deleteResult = await prisma.review.deleteMany({
      where: {
        userId: user.id
      }
    });
    console.log(`Deleted ${deleteResult.count} reviews by Victoria.`);
    
    // Also remove the user to be sure
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log("Removed user Victoria from database.");
  } else {
    console.log("User Victoria not found in database.");
  }

  // Double check for any reviews with "Victoria" in the name just in case
  const reviewsWithVictoria = await prisma.review.findMany({
    where: {
      user: {
        name: {
          contains: "Victoria",
          mode: "insensitive"
        }
      }
    },
    include: { user: true }
  });

  if (reviewsWithVictoria.length > 0) {
    const ids = reviewsWithVictoria.map(r => r.id);
    await prisma.review.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`Deleted ${reviewsWithVictoria.length} additional reviews found with 'Victoria' in the name.`);
  }

  console.log("Cleanup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
