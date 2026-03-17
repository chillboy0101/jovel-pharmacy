import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, isAdminRole } from "@/lib/auth";

function systemRoleToUserRole(systemRole: unknown) {
  const v = String(systemRole || "USER").toUpperCase();
  return v === "ADMIN" ? "ADMIN" : v === "STAFF" ? "STAFF" : "USER";
}

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

    // Revoke role from linked user unless it would demote the last admin.
    if (member?.userId) {
      const linked = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { id: true, role: true },
      });

      if (linked?.role === "ADMIN") {
        const admins = await prisma.user.count({ where: { role: "ADMIN" } });
        if (admins > 1) {
          await prisma.user.update({ where: { id: linked.id }, data: { role: "USER" } });
        }
      } else if (linked) {
        await prisma.user.update({ where: { id: linked.id }, data: { role: "USER" } });
      }
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
    const existing = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true, userId: true, email: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const emailRaw = String(body.email || "").trim().toLowerCase();
    if (!emailRaw) {
      return NextResponse.json(
        { error: "Email is required to link a team member to a user." },
        { status: 400 },
      );
    }

    const linkedUser = await prisma.user.findUnique({
      where: { email: emailRaw },
      select: { id: true, role: true },
    });

    if (!linkedUser) {
      return NextResponse.json(
        { error: "No user found for this email. Create the user first in Admin → Users, then link them here." },
        { status: 400 },
      );
    }

    const nextUserRole = systemRoleToUserRole(body.systemRole);
    if (linkedUser.role === "ADMIN" && nextUserRole !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "You cannot demote the last admin account." },
          { status: 400 },
        );
      }
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio,
        avatar: body.avatar,
        imageUrl: body.imageUrl ?? null,
        systemRole: body.systemRole,
        email: emailRaw,
        userId: linkedUser.id,
      },
    });

    // If linkage changed, revoke the old linked user's elevated role.
    if (existing.userId && existing.userId !== linkedUser.id) {
      const oldUser = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { id: true, role: true },
      });
      if (oldUser && oldUser.role !== "USER") {
        if (oldUser.role === "ADMIN") {
          const admins = await prisma.user.count({ where: { role: "ADMIN" } });
          if (admins > 1) {
            await prisma.user.update({ where: { id: oldUser.id }, data: { role: "USER" } });
          }
        } else {
          await prisma.user.update({ where: { id: oldUser.id }, data: { role: "USER" } });
        }
      }
    }

    await prisma.user.update({
      where: { id: linkedUser.id },
      data: { role: nextUserRole },
    });

    return NextResponse.json(member);
  } catch (err) {
    console.error("[/api/team PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
