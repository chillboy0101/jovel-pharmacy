import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam ?? 4) || 4, 1), 12);

  try {
    const reviews = await prisma.review.findMany({
      where: { rating: { gte: 4 } },
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[/api/home-reviews GET]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
