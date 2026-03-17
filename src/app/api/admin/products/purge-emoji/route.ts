import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const bodySchema = z
  .object({
    dryRun: z.boolean().optional(),
  })
  .optional();

export async function POST(req: Request) {
  const session = await auth();
  const authz = req.headers.get("authorization") ?? "";
  const bearer = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  const tokenOk = !!process.env.ADMIN_MAINTENANCE_TOKEN && bearer === process.env.ADMIN_MAINTENANCE_TOKEN;

  if (!tokenOk) {
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const bodyRaw = await req.json().catch(() => undefined);
    const body = bodySchema.parse(bodyRaw);
    const dryRun = body?.dryRun !== false;

    const missingImageWhere: Prisma.ProductWhereInput = {
      OR: [{ imageUrl: null }, { imageUrl: "" }, { imageUrl: "null" }],
    };

    // Only delete products that are not referenced by orders or reviews.
    // This avoids foreign key errors.
    const safeToDeleteWhere: Prisma.ProductWhereInput = {
      ...missingImageWhere,
      orderItems: { none: {} },
      reviewItems: { none: {} },
    };

    const [candidates, safeToDelete] = await Promise.all([
      prisma.product.findMany({
        where: missingImageWhere,
        select: { id: true, name: true, imageUrl: true, emoji: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: safeToDeleteWhere,
        select: { id: true },
      }),
    ]);

    const safeIds = safeToDelete.map((p) => p.id);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        candidatesCount: candidates.length,
        deletableCount: safeIds.length,
        items: candidates,
      });
    }

    const result = safeIds.length
      ? await prisma.product.deleteMany({
          where: {
            id: { in: safeIds },
          },
        })
      : { count: 0 };

    return NextResponse.json({
      dryRun: false,
      candidatesCount: candidates.length,
      deletedCount: result.count,
      skippedCount: Math.max(0, candidates.length - result.count),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/admin/products/purge-emoji POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
