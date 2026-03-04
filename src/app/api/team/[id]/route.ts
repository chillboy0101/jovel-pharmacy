import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, isAdminRole } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const member = await prisma.teamMember.findUnique({ where: { id } });
    
    // Revoke role from user if email exists
    if (member?.email) {
      await prisma.user.updateMany({
        where: { email: member.email },
        data: { role: "USER" }
      });
    }

    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/team DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || !isAdminRole(user.role)) {
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
        systemRole: body.systemRole,
        email: body.email,
      },
    });

    // Update associated user role if email is provided
    if (body.email && body.systemRole) {
      await prisma.user.updateMany({
        where: { email: body.email },
        data: { role: body.systemRole }
      });
    }

    return NextResponse.json(member);
  } catch (err) {
    console.error("[/api/team PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
