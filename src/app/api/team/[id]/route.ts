import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio,
        avatar: body.avatar,
        imageUrl: body.imageUrl ?? null,
      },
    });
    return NextResponse.json(member);
  } catch (err) {
    console.error("[/api/team PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
