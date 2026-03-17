import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const currentUser = session?.user as { id: string; role: string } | undefined;

  // Only Admin can change roles
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role } = await req.json();
    const { id: userId } = await context.params;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (!(["USER", "STAFF", "ADMIN"] as const).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Prevent demoting the last admin
    if (target.role === "ADMIN" && role !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "You cannot demote the last admin account." },
          { status: 400 },
        );
      }
    }

    // Prevent demoting self if last admin
    if (userId === currentUser.id && role !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "You cannot demote yourself as the last admin account." },
          { status: 400 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("[/api/users/[id]/role PATCH]", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
