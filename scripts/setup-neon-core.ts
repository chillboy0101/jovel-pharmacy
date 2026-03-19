import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminVictoria = {
    name: "Victoria Oluwakemi Akai Quartey",
    email: "admin@jovelpharmacy.com",
    password: "admin123",
  };

  const adminCarl = {
    name: "Carl Quist",
    email: "equalizerjr@gmail.com",
    password: "Elites1375@#",
  };

  const keepEmails = [adminVictoria.email, adminCarl.email];

  // Clear shop/sample data
  await prisma.$transaction([
    prisma.review.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.category.deleteMany({}),
  ]);

  // Clear team members (we'll recreate exactly 2)
  await prisma.teamMember.deleteMany({});

  // Remove any users except the two admins
  await prisma.$transaction([
    prisma.otpToken.deleteMany({ where: { user: { email: { notIn: keepEmails } } } }),
    prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { user: { email: { notIn: keepEmails } } },
          { assignedTo: { email: { notIn: keepEmails } } },
        ],
      },
    }),
    prisma.user.deleteMany({ where: { email: { notIn: keepEmails } } }),
  ]);

  const victoriaHash = await bcrypt.hash(adminVictoria.password, 12);
  const carlHash = await bcrypt.hash(adminCarl.password, 12);

  const victoria = await prisma.user.upsert({
    where: { email: adminVictoria.email },
    update: {
      name: adminVictoria.name,
      password: victoriaHash,
      role: "ADMIN",
    },
    create: {
      name: adminVictoria.name,
      email: adminVictoria.email,
      password: victoriaHash,
      role: "ADMIN",
    },
    select: { id: true, email: true },
  });

  await prisma.user.upsert({
    where: { email: adminCarl.email },
    update: {
      name: adminCarl.name,
      password: carlHash,
      role: "ADMIN",
    },
    create: {
      name: adminCarl.name,
      email: adminCarl.email,
      password: carlHash,
      role: "ADMIN",
    },
    select: { id: true },
  });

  await prisma.teamMember.createMany({
    data: [
      {
        name: adminVictoria.name,
        email: adminVictoria.email,
        role: "Founder & CEO",
        bio: "",
        avatar: "VQ",
        order: 0,
        systemRole: "ADMIN",
        userId: victoria.id,
      },
      {
        name: "General Staff",
        email: null,
        role: "Staff",
        bio: "",
        avatar: "GS",
        order: 1,
        systemRole: "STAFF",
        userId: null,
      },
    ],
  });

  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.teamMember.count(),
    prisma.product.count(),
    prisma.category.count(),
  ]);

  console.log("Setup complete:");
  console.log({ users: counts[0], teamMembers: counts[1], products: counts[2], categories: counts[3] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
