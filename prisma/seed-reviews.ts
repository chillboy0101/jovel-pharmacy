import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)] as T;
}

function sampleUnique<T>(rng: () => number, arr: T[], count: number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, Math.min(count, copy.length)));
}

async function main() {
  const rng = mulberry32(20260317);

  const customerNames = [
    "Ama Mensah",
    "Kofi Owusu",
    "Esi Nyarko",
    "Yaw Boateng",
    "Adjoa Asante",
    "Nana Addo",
    "Akosua Boateng",
    "Kwame Opoku",
    "Yaa Serwaa",
    "Kojo Antwi",
    "Priscilla Mensima",
    "Abena Owusu",
    "Samuel Tetteh",
    "Comfort Agyemang",
    "Josephine Asare",
  ];

  const passwordHash = await bcrypt.hash("customer123", 12);

  const users: { id: string; email: string; name: string | null }[] = [];
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i] as string;
    const email = `reviewer${i + 1}@jovelpharmacy.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: "USER",
        password: passwordHash,
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      create: {
        name,
        email,
        role: "USER",
        password: passwordHash,
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      select: { id: true, email: true, name: true },
    });
    users.push(user);
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  const commentTemplates = [
    "Fast delivery and well packaged.",
    "Good quality and helpful guidance.",
    "Works as expected. Will buy again.",
    "Smooth ordering and quick support.",
    "Authentic product and clear instructions.",
    "Arrived on time and in perfect condition.",
  ];

  const ratingPool = [5, 5, 5, 4, 4, 4, 3];
  const reviewsPerProduct = 4;

  let createdOrUpdated = 0;

  for (const p of products) {
    const chosen = sampleUnique(rng, users, reviewsPerProduct);

    for (const u of chosen) {
      const rating = pick(rng, ratingPool);
      const comment = `${pick(rng, commentTemplates)} (${p.name})`;

      const existing = await prisma.review.findFirst({
        where: { userId: u.id, productId: p.id },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        await prisma.review.update({
          where: { id: existing.id },
          data: { rating, comment },
        });
      } else {
        await prisma.review.create({
          data: { userId: u.id, productId: p.id, rating, comment },
        });
      }

      createdOrUpdated++;
    }

    const agg = await prisma.review.aggregate({
      where: { productId: p.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: p.id },
      data: {
        rating: agg._avg.rating ?? 0,
        reviews: agg._count.rating,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        usersSeeded: users.length,
        productsTouched: products.length,
        reviewsCreatedOrUpdated: createdOrUpdated,
        reviewsPerProduct,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
