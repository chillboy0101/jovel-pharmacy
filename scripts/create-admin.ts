import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const name = "Carl Christian Quist";
  const email = "equalizerjr@gmail.com";
  const password = "Elites1375@#";
  const role = "ADMIN";

  console.log(`Creating admin user: ${name} (${email})...`);

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role,
        emailVerified: new Date(),
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: new Date(),
      },
    });

    console.log("Admin user created/updated successfully:", user.id);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
