import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "jellyjay0702@gmail.com";
  const user = await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date()
    }
  });

  console.log("User manually verified:", user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
