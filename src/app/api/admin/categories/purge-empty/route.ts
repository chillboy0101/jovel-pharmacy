import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

    const emptyWhere = {
      products: { none: {} },
    } as const;

    const candidates = await prisma.category.findMany({
      where: emptyWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        candidatesCount: candidates.length,
        items: candidates,
      });
    }

    const ids = candidates.map((c) => c.id);
    const result = ids.length
      ? await prisma.category.deleteMany({
          where: { id: { in: ids } },
        })
      : { count: 0 };

    return NextResponse.json({
      dryRun: false,
      deletedCount: result.count,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/admin/categories/purge-empty POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
