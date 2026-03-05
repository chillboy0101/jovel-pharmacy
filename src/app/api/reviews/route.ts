import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/reviews?productId=xxx&take=6&cursor=reviewId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const takeParam = searchParams.get("take");
  const cursor = searchParams.get("cursor");

  const take = Math.min(Math.max(Number(takeParam ?? 6) || 6, 1), 20);

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  try {
    const [items, totalCountAgg, avgAgg] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: { user: { select: { name: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
      }),
      prisma.review.aggregate({
        where: { productId },
        _count: { id: true },
      }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
    ]);

    const hasMore = items.length > take;
    const sliced = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;

    return NextResponse.json({
      items: sliced,
      nextCursor,
      totalCount: totalCountAgg._count.id,
      avgRating: avgAgg._avg.rating ?? 0,
    });
  } catch (err) {
    console.error("[/api/reviews GET]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
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
