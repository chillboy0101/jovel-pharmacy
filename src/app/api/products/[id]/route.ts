import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

const updateSchema = z
  .object({
    name: z.string().min(1),
    brand: z.string().min(1),
    categoryId: z.string().min(1),
    basePrice: z.number().positive(),
    discountPercent: z.number().min(0).max(100),
    description: z.string().min(1),
    dosage: z.string().nullable(),
    rating: z.number().min(0).max(5),
    reviews: z.number().int().min(0),
    stock: z.number().int().min(0),
    costPrice: z.number().min(0),
    badge: z.enum(["bestseller", "new", "sale"]).nullable(),
    emoji: z.string().min(1),
    imageUrl: z.string().url().nullable().or(z.literal("")),
  })
  .partial();

function computeDiscountedPrice(basePrice: number, discountPercent: number) {
  if (!discountPercent || discountPercent <= 0) return basePrice;
  const discounted = basePrice * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    
    // Normalize data for Zod validation
    const normalizedData = { ...body };
    if (normalizedData.dosage === "" || normalizedData.dosage === undefined) normalizedData.dosage = null;
    if (normalizedData.badge === "" || normalizedData.badge === undefined) normalizedData.badge = null;
    if (normalizedData.imageUrl === "" || normalizedData.imageUrl === undefined) normalizedData.imageUrl = null;
    
    // Convert strings to numbers if they come from a form
    if (typeof normalizedData.basePrice === "string") {
      const v = parseFloat(normalizedData.basePrice);
      if (Number.isNaN(v)) delete normalizedData.basePrice;
      else normalizedData.basePrice = v;
    }
    if (typeof normalizedData.costPrice === "string") {
      const v = parseFloat(normalizedData.costPrice);
      if (Number.isNaN(v)) delete normalizedData.costPrice;
      else normalizedData.costPrice = v;
    }
    if (typeof normalizedData.stock === "string") {
      const v = parseInt(normalizedData.stock, 10);
      if (Number.isNaN(v)) delete normalizedData.stock;
      else normalizedData.stock = v;
    }
    if (typeof normalizedData.discountPercent === "string") {
      const v = parseFloat(normalizedData.discountPercent);
      if (Number.isNaN(v)) delete normalizedData.discountPercent;
      else normalizedData.discountPercent = v;
    }

    // Disallow client-controlled originalPrice; it is derived from discountPercent
    if ("originalPrice" in normalizedData) delete normalizedData.originalPrice;

    const data = updateSchema.parse(normalizedData);

    // Attempt to find the product first (it might be using a slug as an ID from static data)
    let product = await prisma.product.findUnique({ where: { id } });
    
    // If not found by ID, it might be a slug from the static products list
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { categoryId, basePrice, discountPercent, ...rest } = data as any;

    const updateData: any = { ...rest };

    if (basePrice !== undefined || discountPercent !== undefined) {
      const finalBasePrice = basePrice ?? product.originalPrice ?? product.price;
      const finalDiscountPercent = discountPercent ?? product.discountPercent ?? 0;
      
      updateData.price = computeDiscountedPrice(finalBasePrice, finalDiscountPercent);
      updateData.originalPrice = finalDiscountPercent > 0 ? finalBasePrice : null;
      updateData.discountPercent = finalDiscountPercent;
    }

    if (categoryId) {
      updateData.category = { connect: { id: categoryId } };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });
    return NextResponse.json(updatedProduct);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 },
      );
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error(`[PATCH /api/products/${id}] Prisma validation error:`, err);
      return NextResponse.json(
        {
          error: "Invalid product data",
          details: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 400 },
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Common: FK constraint fails when categoryId is invalid
      if (err.code === "P2003") {
        return NextResponse.json(
          { error: "Invalid category. Please select a valid category." },
          { status: 400 },
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      console.error(`[PATCH /api/products/${id}] Prisma error ${err.code}:`, err);
      return NextResponse.json(
        { error: "Failed to update product", code: err.code },
        { status: 400 },
      );
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      console.error(`[PATCH /api/products/${id}] Prisma unknown error:`, err);
      return NextResponse.json(
        {
          error: "Database error",
          details: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 500 },
      );
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
      console.error(`[PATCH /api/products/${id}] Prisma panic:`, err);
      return NextResponse.json(
        { error: "Database engine error" },
        { status: 500 },
      );
    }

    console.error(`[PATCH /api/products/${id}] Error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
