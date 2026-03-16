import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

function isPrismaConnectionError(err: unknown) {
  const anyErr = err as { code?: string; message?: string } | null;
  const code = anyErr?.code;
  if (code === "P1001" || code === "P2024") return true;
  const msg = anyErr?.message ?? "";
  return msg.includes("Can't reach database server") || msg.includes("connection pool");
}

const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  avatar: z.string().default("?"),
  imageUrl: z.string().optional().nullable(),
  order: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const team = await prisma.teamMember.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(team);
  } catch (err) {
    console.error("[/api/admin/team GET]", err);
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = teamMemberSchema.parse(body);

    const member = await prisma.teamMember.create({
      data,
    });
    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/admin/team POST]", err);
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const data = teamMemberSchema.partial().parse(rest);

    const member = await prisma.teamMember.update({
      where: { id },
      data,
    });
    return NextResponse.json(member);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/admin/team PUT]", err);
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.teamMember.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/admin/team DELETE]", err);
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
