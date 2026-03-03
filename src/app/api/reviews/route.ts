import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/reviews?productId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// POST /api/reviews — authenticated users only, one review per product
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    // Upsert — allow updating their own review
    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: session.user.id as string,
          productId: data.productId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment,
      },
      create: {
        userId: session.user.id as string,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
      },
      include: { user: { select: { name: true } } },
    });

    // Recalculate product average rating and review count
    const agg = await prisma.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviews: agg._count.rating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
