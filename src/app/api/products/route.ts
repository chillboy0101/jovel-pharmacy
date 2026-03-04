import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = searchParams.get("cat");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const badge = searchParams.get("badge");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};
    if (cat && cat !== "all") where.categoryId = cat;
    if (badge) where.badge = badge;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Record<string, string> | undefined;
    switch (sort) {
      case "price-asc": orderBy = { price: "asc" }; break;
      case "price-desc": orderBy = { price: "desc" }; break;
      case "rating": orderBy = { rating: "desc" }; break;
      case "name": orderBy = { name: "asc" }; break;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[/api/products GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

const createProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  categoryId: z.string().min(1),
  basePrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  description: z.string().min(1),
  dosage: z.string().optional(),
  stock: z.number().int().min(0),
  costPrice: z.number().min(0).default(0),
  expiryDate: z.string().optional().nullable(),
  badge: z.enum(["bestseller", "new", "sale"]).optional(),
  emoji: z.string().default("💊"),
  imageUrl: z.string().url().optional(),
});

function computeDiscountedPrice(basePrice: number, discountPercent: number) {
  if (!discountPercent || discountPercent <= 0) return basePrice;
  const discounted = basePrice * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProductSchema.parse(body);

    const { categoryId, basePrice, discountPercent, ...rest } = data;

    const price = computeDiscountedPrice(basePrice, discountPercent);
    const originalPrice = discountPercent > 0 ? basePrice : null;
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    const product = await prisma.product.create({
      data: {
        ...rest,
        price,
        originalPrice,
        discountPercent,
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
