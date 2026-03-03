import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");
  const badge = searchParams.get("badge");

  const where: Record<string, unknown> = {};
  if (cat && cat !== "all") where.categoryId = cat;
  if (badge) where.badge = badge;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { description: { contains: search } },
    ];
  }

  let orderBy: Record<string, string> | undefined;
  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { rating: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
  });

  return NextResponse.json(products);
}

const createProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  description: z.string().min(1),
  dosage: z.string().optional(),
  stock: z.number().int().min(0),
  badge: z.enum(["bestseller", "new", "sale"]).optional(),
  emoji: z.string().default("💊"),
  imageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProductSchema.parse(body);

    const product = await prisma.product.create({ data });
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
