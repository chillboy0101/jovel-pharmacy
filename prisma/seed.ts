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

function randInt(rng: () => number, min: number, max: number) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function chooseReviewCount(rng: () => number, badge: string | null | undefined, max: number) {
  const b = (badge || "").toLowerCase();
  let min = 1;
  let high = Math.min(max, 8);

  if (b === "bestseller") {
    min = 6;
    high = Math.min(max, 15);
  } else if (b === "sale") {
    min = 3;
    high = Math.min(max, 12);
  } else if (b === "new") {
    min = 1;
    high = Math.min(max, 6);
  }

  if (high < min) min = Math.max(1, high);
  const r = rng();
  if (r < 0.25) return randInt(rng, min, Math.min(high, min + 1));
  if (r < 0.7) return randInt(rng, Math.min(high, min + 2), Math.min(high, min + 5));
  return randInt(rng, Math.min(high, min + 4), high);
}

type WikidataRow = {
  item: { value: string };
  itemLabel: { value: string };
  atc: { value: string };
  image: { value: string };
  manufacturerLabel?: { value: string };
  formLabel?: { value: string };
};

type CommonsImageInfo = {
  url?: string;
};

type CommonsPage = {
  imageinfo?: CommonsImageInfo[];
};

type CommonsApiResponse = {
  query?: {
    pages?: Record<string, CommonsPage>;
  };
};

async function fetchWikidataProducts(limit: number) {
  const query = `
SELECT ?item ?itemLabel ?atc ?image ?manufacturerLabel ?formLabel WHERE {
  ?item wdt:P31 wd:Q12140.
  ?item wdt:P267 ?atc.
  ?item wdt:P18 ?image.
  OPTIONAL { ?item wdt:P176 ?manufacturer. }
  OPTIONAL { ?item wdt:P1419 ?form. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${Math.max(1, Math.min(500, limit))}
`;

  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("format", "json");
  url.searchParams.set("query", query);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "jovel-pharmacy-seed/1.0 (local dev)",
    },
  });
  if (!res.ok) {
    throw new Error(`Wikidata query failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: { bindings?: WikidataRow[] };
  };
  return data.results?.bindings ?? [];
}

async function resolveCommonsImageUrl(fileName: string) {
  const title = `File:${fileName}`;
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "jovel-pharmacy-seed/1.0 (local dev)",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as CommonsApiResponse;
  const pages = json?.query?.pages;
  if (!pages) return null;
  const firstKey = Object.keys(pages)[0];
  const page = pages[firstKey];
  const ii = page?.imageinfo?.[0];
  return (ii?.url as string | undefined) ?? null;
}

function atcToCategoryId(atc: string) {
  const letter = (atc || "").trim().charAt(0).toUpperCase();
  switch (letter) {
    case "A":
      return "digestive";
    case "B":
      return "blood";
    case "C":
      return "cardio";
    case "D":
      return "derma";
    case "G":
      return "uro";
    case "H":
      return "hormones";
    case "J":
      return "antiinfectives";
    case "L":
      return "oncology";
    case "M":
      return "musculoskeletal";
    case "N":
      return "nervous";
    case "P":
      return "antiparasitic";
    case "R":
      return "respiratory";
    case "S":
      return "sensory";
    case "V":
      return "various";
    default:
      return "various";
  }
}

async function main() {
  // --- Team users (keep DB limited to these by default) ---
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const carlPasswordHash = await bcrypt.hash("Elites1375@#", 12);
  const teamUsers = [
    {
      email: "equalizerjr@gmail.com",
      name: "Carl Quist",
      role: "ADMIN",
      passwordHash: carlPasswordHash,
    },
    {
      email: "admin@jovelpharmacy.com",
      name: "Victoria Oluwakemi Akai Quartey",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
    {
      email: "marcus@jovelpharmacy.com",
      name: "Marcus Thompson",
      role: "STAFF",
      passwordHash: adminPasswordHash,
    },
  ] as const;

  const seededTeamUsers = [] as { id: string; email: string }[];
  for (const u of teamUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: u.passwordHash,
      },
      create: {
        email: u.email,
        name: u.name,
        password: u.passwordHash,
        role: u.role,
      },
      select: { id: true, email: true },
    });
    seededTeamUsers.push(user);
  }
  console.log(`✓ Team users seeded (${teamUsers.length} users)`);

  const keepEmails = seededTeamUsers.map((u) => u.email);
  const usersToDelete = await prisma.user.findMany({
    where: { email: { notIn: keepEmails } },
    select: { id: true },
  });
  const deleteUserIds = usersToDelete.map((u) => u.id);

  if (deleteUserIds.length > 0) {
    const ordersToDelete = await prisma.order.findMany({
      where: { userId: { in: deleteUserIds } },
      select: { id: true },
    });
    const deleteOrderIds = ordersToDelete.map((o) => o.id);

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { userId: { in: deleteUserIds } } }),
      prisma.chatMessage.deleteMany({
        where: {
          OR: [{ userId: { in: deleteUserIds } }, { assignedToId: { in: deleteUserIds } }],
        },
      }),
      prisma.otpToken.deleteMany({ where: { userId: { in: deleteUserIds } } }),
      prisma.orderItem.deleteMany({ where: { orderId: { in: deleteOrderIds } } }),
      prisma.order.deleteMany({ where: { id: { in: deleteOrderIds } } }),
      prisma.user.deleteMany({ where: { id: { in: deleteUserIds } } }),
    ]);
  }

  // --- Team ---
  const userIdByEmail = new Map(
    seededTeamUsers.map((u: { email: string; id: string }) => [u.email, u.id]),
  );
  await prisma.teamMember.deleteMany({});
  await prisma.teamMember.createMany({
    data: [
      {
        name: "Victoria Oluwakemi Akai Quartey",
        email: "admin@jovelpharmacy.com",
        role: "Founder & CEO",
        bio: "Visionary leader with a passion for accessible healthcare and community wellness.",
        avatar: "VQ",
        order: 0,
        systemRole: "ADMIN",
        userId: userIdByEmail.get("admin@jovelpharmacy.com"),
      },
      {
        name: "Marcus Thompson",
        email: "marcus@jovelpharmacy.com",
        role: "Senior Pharmacist",
        bio: "Specialist in medication therapy management and chronic disease support.",
        avatar: "MT",
        order: 1,
        systemRole: "STAFF",
        userId: userIdByEmail.get("marcus@jovelpharmacy.com"),
      },
    ],
  });
  console.log("✓ Team seeded (2 members)");

  const seedDemoCustomers = process.env.SEED_DEMO_CUSTOMERS === "1";
  const customers = seedDemoCustomers
    ? [
        { email: "customer1@jovelpharmacy.com", name: "Ama Mensah" },
        { email: "customer2@jovelpharmacy.com", name: "Kofi Owusu" },
        { email: "customer3@jovelpharmacy.com", name: "Esi Nyarko" },
        { email: "customer4@jovelpharmacy.com", name: "Yaw Boateng" },
        { email: "customer5@jovelpharmacy.com", name: "Adjoa Asante" },
        { email: "customer6@jovelpharmacy.com", name: "Nana Addo" },
        { email: "customer7@jovelpharmacy.com", name: "Akosua Boateng" },
        { email: "customer8@jovelpharmacy.com", name: "Kwame Opoku" },
        { email: "customer9@jovelpharmacy.com", name: "Yaa Serwaa" },
        { email: "customer10@jovelpharmacy.com", name: "Abena Owusu" },
        { email: "customer11@jovelpharmacy.com", name: "Kojo Antwi" },
        { email: "customer12@jovelpharmacy.com", name: "Priscilla Mensima" },
      ]
    : [];

  if (customers.length > 0) {
    const customerPassword = await bcrypt.hash("customer123", 12);
    for (const c of customers) {
      await prisma.user.upsert({
        where: { email: c.email },
        update: { name: c.name },
        create: {
          email: c.email,
          name: c.name,
          password: customerPassword,
          role: "USER",
        },
      });
    }
    console.log(`✓ ${customers.length} customer users seeded (password: customer123)`);
  }

  // --- Categories ---
  if (process.env.SEED_DEFAULT_CATEGORIES === "1") {
    const categories = [
      { id: "wellness", name: "Wellness & Vitamins", description: "Daily essentials for energy, immunity, and balance.", icon: "Sparkles" },
      { id: "cold-flu", name: "Cold & Flu", description: "Relief you can trust when you need it most.", icon: "ShieldPlus" },
      { id: "pain-relief", name: "Pain Relief", description: "Fast-acting solutions for aches and inflammation.", icon: "Activity" },
      { id: "skincare", name: "Skincare", description: "Dermatologist-inspired care for healthy skin.", icon: "Droplet" },
      { id: "personal-care", name: "Personal Care", description: "Modern hygiene, oral care, and daily comfort.", icon: "Heart" },
      { id: "devices", name: "Health Devices", description: "Premium tools for monitoring and peace of mind.", icon: "Stethoscope" },
      { id: "digestive", name: "Digestive & Metabolism", description: "Digestive health, antacids, and metabolic care.", icon: "HeartPulse" },
      { id: "blood", name: "Blood & Blood Forming", description: "Anaemia support and blood-related therapies.", icon: "Droplet" },
      { id: "cardio", name: "Cardiovascular", description: "Blood pressure, heart health, and circulation medicines.", icon: "Activity" },
      { id: "derma", name: "Dermatological", description: "Topical treatments and skin condition medicines.", icon: "Droplet" },
      { id: "uro", name: "Urinary & Reproductive", description: "Urinary and reproductive health medicines.", icon: "Heart" },
      { id: "hormones", name: "Hormones", description: "Endocrine and hormone-related medicines.", icon: "Sparkles" },
      { id: "antiinfectives", name: "Anti-infectives", description: "Antibiotics and anti-infective medicines.", icon: "ShieldPlus" },
      { id: "oncology", name: "Oncology", description: "Cancer-related medicines (special handling).", icon: "ShieldPlus" },
      { id: "musculoskeletal", name: "Musculoskeletal", description: "Bone, joint, and muscle medicines.", icon: "Activity" },
      { id: "nervous", name: "Nervous System", description: "Neurology and mental health medicines.", icon: "Sparkles" },
      { id: "antiparasitic", name: "Antiparasitic", description: "Antiparasitic medicines and treatments.", icon: "ShieldPlus" },
      { id: "respiratory", name: "Respiratory", description: "Asthma and breathing support medicines.", icon: "ShieldPlus" },
      { id: "sensory", name: "Sensory Organs", description: "Eye/ear related medicines.", icon: "Droplet" },
      { id: "various", name: "Other Medicines", description: "Additional pharmacy medicines and products.", icon: "Package" },
    ];

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, description: cat.description, icon: cat.icon },
        create: cat,
      });
    }
    console.log(`✓ ${categories.length} default categories seeded`);
  }

  if (process.env.SEED_REAL_PRODUCTS === "1") {
    const rawLimit = parseInt(process.env.SEED_REAL_PRODUCTS_LIMIT || "200", 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 200;
    const rows = await fetchWikidataProducts(limit);
    let ok = 0;
    let fail = 0;

    for (const row of rows) {
      try {
        const qid = row.item.value.split("/").pop() || "";
        if (!qid) {
          fail++;
          continue;
        }

        const name = row.itemLabel.value;
        const categoryId = atcToCategoryId(row.atc.value);
        const form = row.formLabel?.value;
        const dosage = form ? String(form).slice(0, 60) : null;

        const fileName = decodeURIComponent(
          (row.image.value.split("/Special:FilePath/")[1] || row.image.value.split("/").pop() || "").replace(/\?.*$/, ""),
        );
        const imageUrl = fileName ? await resolveCommonsImageUrl(fileName) : null;

        const base = Array.from(qid).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const stock = (base % 80) + 10;

        await prisma.product.upsert({
          where: { id: `wd-${qid}` },
          update: {
            name,
            categoryId,
            originalPrice: null,
            discountPercent: 0,
            description: `Medicine: ${name}. Use only as directed by a pharmacist or doctor.`,
            dosage,
            rating: 0,
            reviews: 0,
            stock,
            badge: null,
            emoji: "💊",
            imageUrl,
          },
          create: {
            id: `wd-${qid}`,
            name,
            categoryId,
            originalPrice: null,
            discountPercent: 0,
            description: `Medicine: ${name}. Use only as directed by a pharmacist or doctor.`,
            dosage,
            rating: 0,
            reviews: 0,
            stock,
            badge: null,
            emoji: "💊",
            imageUrl,
          },
        });
        ok++;
      } catch {
        fail++;
      }
    }

    console.log(`✓ Real products seeded from Wikidata: ${ok} ok, ${fail} failed`);
  }

  // --- Storefront badges ---
  {
    const saleCount = parseInt(process.env.SEED_SALE_COUNT || "60", 10);
    const bestsellerCount = parseInt(process.env.SEED_BESTSELLER_COUNT || "60", 10);
    const newCount = parseInt(process.env.SEED_NEW_COUNT || "60", 10);

    const safeSaleCount = Number.isFinite(saleCount) ? Math.max(0, Math.min(100, saleCount)) : 60;
    const safeBestsellerCount = Number.isFinite(bestsellerCount) ? Math.max(0, Math.min(100, bestsellerCount)) : 60;
    const safeNewCount = Number.isFinite(newCount) ? Math.max(0, Math.min(100, newCount)) : 60;

    const storefrontWhere = {
      OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      AND: [{ imageUrl: { not: null } }, { imageUrl: { not: "" } }, { imageUrl: { not: "null" } }],
    };

    const [saleCandidates, bestsellerCandidates, newCandidates] = await Promise.all([
      prisma.product.findMany({
        where: storefrontWhere,
        select: { id: true },
        orderBy: [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }],
        take: Math.max(safeSaleCount * 5, 1),
      }),
      prisma.product.findMany({
        where: storefrontWhere,
        select: { id: true },
        orderBy: [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }],
        take: Math.max(safeBestsellerCount * 5, 1),
      }),
      prisma.product.findMany({
        where: storefrontWhere,
        select: { id: true },
        orderBy: [{ createdAt: "desc" }, { rating: "desc" }],
        take: Math.max(safeNewCount * 5, 1),
      }),
    ]);

    const used = new Set<string>();
    const pickUnique = (ids: Array<{ id: string }>, count: number) => {
      const out: string[] = [];
      for (const p of ids) {
        if (out.length >= count) break;
        if (used.has(p.id)) continue;
        used.add(p.id);
        out.push(p.id);
      }
      return out;
    };

    const saleIds = pickUnique(saleCandidates, safeSaleCount);
    const bestsellerIds = pickUnique(bestsellerCandidates, safeBestsellerCount);
    const newIds = pickUnique(newCandidates, safeNewCount);

    const [saleRes, bestRes, newRes] = await Promise.all([
      saleIds.length
        ? prisma.product.updateMany({ where: { id: { in: saleIds } }, data: { badge: "sale" } })
        : Promise.resolve({ count: 0 }),
      bestsellerIds.length
        ? prisma.product.updateMany({ where: { id: { in: bestsellerIds } }, data: { badge: "bestseller" } })
        : Promise.resolve({ count: 0 }),
      newIds.length
        ? prisma.product.updateMany({ where: { id: { in: newIds } }, data: { badge: "new" } })
        : Promise.resolve({ count: 0 }),
    ]);

    console.log(
      `✓ Storefront badges seeded (sale: ${saleRes.count}, bestseller: ${bestRes.count}, new: ${newRes.count})`,
    );
  }

  // --- Reviews for all products (4+ average) ---
  {
    const rng = mulberry32(20260319);
    const reviewerNames = [
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
    const reviewers: { id: string; email: string; name: string | null }[] = [];
    for (let i = 0; i < reviewerNames.length; i++) {
      const name = reviewerNames[i] as string;
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
      reviewers.push(user);
    }

    const products = await prisma.product.findMany({
      select: { id: true, name: true, badge: true },
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

    const ratingPool = [5, 5, 5, 5, 4, 4];
    let seededReviewsDeleted = 0;
    let reviewsCreated = 0;

    for (const p of products) {
      const targetCount = chooseReviewCount(rng, p.badge, reviewers.length);
      const chosen = sampleUnique(rng, reviewers, Math.min(reviewers.length, targetCount));

      const del = await prisma.review.deleteMany({
        where: {
          productId: p.id,
          userId: { in: reviewers.map((u) => u.id) },
        },
      });
      seededReviewsDeleted += del.count;

      for (const u of chosen) {
        const rating = pick(rng, ratingPool);
        const comment = `${pick(rng, commentTemplates)} (${p.name})`;
        await prisma.review.create({
          data: { userId: u.id, productId: p.id, rating, comment },
        });
        reviewsCreated++;
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
      `✓ Reviews seeded for storefront (reviewers: ${reviewers.length}, products: ${products.length}, deleted: ${seededReviewsDeleted}, created: ${reviewsCreated})`,
    );
  }

  {
    const res = await prisma.product.updateMany({
      where: {
        OR: [{ reviews: 0 }, { rating: { lte: 0 } }],
      },
      data: {
        reviews: 1,
        rating: 4.1,
      },
    });
    console.log(`✓ Backfilled products to avoid zero reviews (updated: ${res.count})`);
  }

  // --- Real product reviews (best ones for homepage) ---
  const seededUsers = customers.length
    ? await prisma.user.findMany({
        where: { email: { in: customers.map((c) => c.email) } },
        select: { id: true, email: true },
      })
    : [];
  const reviewUserIdByEmail = new Map(
    seededUsers.map((u: { email: string; id: string }) => [u.email, u.id]),
  );

  const reviewSeed = customers.length
    ? [
    {
      email: "customer1@jovelpharmacy.com",
      productId: "vitamin-c-1000",
      rating: 5,
      comment: "Quick delivery and great service. The pharmacist explained how to take it properly — really helpful.",
    },
    {
      email: "customer2@jovelpharmacy.com",
      productId: "ibuprofen-400",
      rating: 5,
      comment: "Order was smooth and the medication was well packaged. I will definitely shop again.",
    },
    {
      email: "customer3@jovelpharmacy.com",
      productId: "sunscreen-50",
      rating: 4,
      comment: "Good product and the team gave clear advice for my skin type. Great experience overall.",
    },
    {
      email: "customer4@jovelpharmacy.com",
      productId: "blood-pressure",
      rating: 5,
      comment: "Excellent support choosing the right device. The instructions were clear and it works perfectly.",
    },
    {
      email: "customer5@jovelpharmacy.com",
      productId: "omega-3-fish-oil",
      rating: 5,
      comment: "High quality and authentic. I also got helpful guidance on dosage. Great customer care.",
    },
    {
      email: "customer6@jovelpharmacy.com",
      productId: "multivitamin-daily",
      rating: 4,
      comment: "Good value for money and the delivery was on time. Packaging was neat.",
    },
    {
      email: "customer7@jovelpharmacy.com",
      productId: "cold-flu-max",
      rating: 5,
      comment: "Fast relief and the pharmacist explained what to avoid combining it with. Very professional.",
    },
    {
      email: "customer8@jovelpharmacy.com",
      productId: "nasal-spray",
      rating: 4,
      comment: "Works well and feels gentle. The store experience was smooth and staff were friendly.",
    },
    {
      email: "customer9@jovelpharmacy.com",
      productId: "hyaluronic-serum",
      rating: 5,
      comment: "Excellent recommendation. My skin feels more hydrated and the product is original.",
    },
    {
      email: "customer10@jovelpharmacy.com",
      productId: "moisturizer-daily",
      rating: 4,
      comment: "Good moisturizer and I got clear usage advice. Will buy again.",
    },
    {
      email: "customer11@jovelpharmacy.com",
      productId: "pulse-oximeter",
      rating: 5,
      comment: "Easy to use and accurate. The team helped me choose between options — great service.",
    },
    {
      email: "customer12@jovelpharmacy.com",
      productId: "thermometer-ir",
      rating: 4,
      comment: "Works as expected and the delivery was quick. Good support from the pharmacist.",
    },
      ]
    : [];

  if (reviewSeed.length > 0) {
    for (const r of reviewSeed) {
      const userId = reviewUserIdByEmail.get(r.email);
      if (!userId) continue;

      const existing = await prisma.review.findFirst({
        where: { userId, productId: r.productId },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        await prisma.review.update({
          where: { id: existing.id },
          data: {
            rating: r.rating,
            comment: r.comment,
          },
        });
      } else {
        await prisma.review.create({
          data: {
            userId,
            productId: r.productId,
            rating: r.rating,
            comment: r.comment,
          },
        });
      }
    }
    console.log(`✓ ${reviewSeed.length} real product reviews seeded`);

    const reviewedProductIds = Array.from(new Set(reviewSeed.map((r) => r.productId)));
    for (const productId of reviewedProductIds) {
      const agg = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: agg._avg.rating ?? 0,
          reviews: agg._count.rating,
        },
      });
    }
    console.log(`✓ Updated rating & review counts for ${reviewedProductIds.length} products`);
  }
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
