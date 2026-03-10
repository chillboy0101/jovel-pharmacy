import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "jellyjay0702@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      emailVerified: true
    }
  });

  if (!user) {
    console.log("User not found: " + email);
    return;
  }

  console.log("User details:", JSON.stringify({ ...user, password: "[REDACTED]" }, null, 2));
  
  // Test password verification if user wants to provide a password, 
  // but for now let's just see if the account is there and verified.
  console.log("Email verified:", user.emailVerified);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
