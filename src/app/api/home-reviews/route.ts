import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam ?? 4) || 4, 1), 12);

  try {
    const ids = (await prisma.$queryRaw<Array<{ id: string }>>`
      WITH ranked AS (
        SELECT
          r.id,
          r."productId",
          r.rating,
          r."createdAt",
          ROW_NUMBER() OVER (
            PARTITION BY r."productId"
            ORDER BY r.rating DESC, r."createdAt" DESC, r.id DESC
          ) AS rn
        FROM "Review" r
        INNER JOIN "Product" p ON p.id = r."productId"
        WHERE r.rating >= 4
      )
      SELECT id
      FROM ranked
      WHERE rn = 1
      ORDER BY rating DESC, "createdAt" DESC
      LIMIT ${limit};
    `);

    if (!ids.length) {
      return NextResponse.json([]);
    }

    const reviews = await prisma.review.findMany({
      where: { id: { in: ids.map((r) => r.id) } },
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });

    return NextResponse.json(reviews.slice(0, limit));
  } catch (err) {
    console.error("[/api/home-reviews GET]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
