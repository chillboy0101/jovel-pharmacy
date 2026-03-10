import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ["equalizerjr@gmail.com", "admin@jovelpharmacy.com"]
      }
    },
    select: {
      email: true,
      role: true,
      emailVerified: true,
    }
  });
  console.log("Users in database:", JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
