import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@jovelpharmacy.com";
  const password = "adminpassword123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      emailVerified: new Date(),
      role: "ADMIN",
      name: "Victoria Oluwakemi Akai Quartey",
    },
    create: {
      email,
      name: "Victoria Oluwakemi Akai Quartey",
      password: hashedPassword,
      emailVerified: new Date(),
      role: "ADMIN",
    },
  });

  console.log("Admin user created/updated:", user.email);
  console.log("You can now sign in with:");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
