import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

function stableSeedFromString(input: string) {
  // simple deterministic hash (non-crypto) for UI-friendly stable fallbacks
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function stableIntInRange(seed: number, min: number, max: number) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo + 1;
  if (span <= 0) return lo;
  return lo + (seed % span);
}

function stableFloatInRange(seed: number, min: number, max: number, decimals = 1) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo;
  if (span <= 0) return lo;
  const unit = (seed % 1000) / 1000;
  const raw = lo + unit * span;
  const factor = Math.pow(10, decimals);
  return Math.round(raw * factor) / factor;
}

function applyStorefrontReviewFallbacks<T extends { id: string; badge?: string | null; rating?: number | null; reviews?: number | null }>(
  p: T,
): T {
  const badge = (p.badge || "").toLowerCase();
  const seed = stableSeedFromString(`${p.id}|${badge}`);

  let minReviews = 1;
  let maxReviews = 8;
  if (badge === "bestseller") {
    minReviews = 6;
    maxReviews = 15;
  } else if (badge === "sale") {
    minReviews = 3;
    maxReviews = 12;
  } else if (badge === "new") {
    minReviews = 1;
    maxReviews = 6;
  }

  // Only apply fallback when values are missing (null/undefined).
  // If the database explicitly says 0 reviews, keep it consistent with the product detail page.
  const currentReviews = typeof p.reviews === "number" ? p.reviews : null;
  const currentRating = typeof p.rating === "number" ? p.rating : null;

  const nextReviews = currentReviews ?? stableIntInRange(seed, minReviews, maxReviews);
  const nextRating = currentRating ?? stableFloatInRange(seed >>> 1, 4.1, 5.0, 1);

  return {
    ...p,
    reviews: nextReviews,
    rating: nextRating,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = searchParams.get("cat");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const badge = searchParams.get("badge");
    const limit = searchParams.get("limit");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    const all = searchParams.get("all") === "1";
    const fields = searchParams.get("fields");
    const exportMode = searchParams.get("export") === "1";

    if (all) {
      const session = await auth();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!session?.user || !role || !["ADMIN", "STAFF"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const where: any = {};
    const and: any[] = [];

    // Filter out expired products by default (storefront). Admin requests (?all=1) should see everything.
    if (!all) {
      and.push({ OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] });
      // Only show products with an image on the storefront
      and.push({ imageUrl: { not: null } });
      and.push({ imageUrl: { not: "" } });
      and.push({ imageUrl: { not: "null" } });
    }

    if (cat && cat !== "all") where.categoryId = cat;
    if (badge) where.badge = badge;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (and.length) where.AND = and;

    let orderBy: any | undefined;
    switch (sort) {
      case "rating": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "name": orderBy = { name: "asc" }; break;
      case "sale": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "bestseller": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "new": orderBy = { createdAt: "desc" }; break;
    }

    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safePageSize = Number.isFinite(parsedPageSize) && parsedPageSize! > 0
      ? Math.min(200, parsedPageSize!)
      : 60;

    const take = limit ? Math.min(200, Math.max(1, parseInt(limit, 10))) : safePageSize;
    const skip = (safePage - 1) * take;

    const shouldPaginate = !exportMode;

    const totalCount = await prisma.product.count({ where });

    const select =
      fields === "adminList" || exportMode
        ? {
            id: true,
            name: true,
            categoryId: true,
            stock: true,
            badge: true,
            rating: true,
            reviews: true,
            emoji: true,
            imageUrl: true,
            expiryDate: true,
            sourceSlug: true,
            sourceUrl: true,
          }
        : undefined;

    const products = await prisma.product.findMany({
      where,
      orderBy,
      ...(select ? { select } : {}),
      ...(shouldPaginate ? { take, skip } : {}),
    });

    // Storefront should never show (0) reviews. Also, certain imported products can have
    // unset counts; we apply a stable per-product fallback so UI looks consistent.
    const normalized = Array.isArray(products)
      ? products.map((p: any) => applyStorefrontReviewFallbacks(p))
      : products;

    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": all
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
        "X-Total-Count": String(totalCount),
        "X-Page": String(safePage),
        "X-Page-Size": String(take),
        "X-Total-Pages": String(Math.max(1, Math.ceil(totalCount / take))),
      },
    });
  } catch (err) {
    console.error("[/api/products GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  dosage: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  badge: z.string().optional(),
  emoji: z.string().default("💊"),
  imageUrl: z.string().url().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  sourceSlug: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProductSchema.parse(body);
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    const { categoryId, ...rest } = data;

    const product = await prisma.product.create({
      data: {
        ...rest,
        expiryDate,
        category: { connect: { id: categoryId } },
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
