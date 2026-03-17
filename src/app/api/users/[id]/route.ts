import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z
  .object({
    name: z.string().trim().min(1).nullable().optional(),
    password: z.string().min(6).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided",
  });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const currentUser = session?.user as { id: string; role: string } | undefined;

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const updateData: { name?: string | null; password?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    console.error("[/api/users/[id] PATCH]", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const currentUser = session?.user as { id: string; role: string } | undefined;

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;

  if (userId === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "You cannot delete the last admin account." },
          { status: 400 },
        );
      }
    }

    const ordersToDelete = await prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });
    const deleteOrderIds = ordersToDelete.map((o) => o.id);

    await prisma.$transaction([
      prisma.teamMember.updateMany({ where: { userId }, data: { userId: null } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.chatMessage.deleteMany({
        where: {
          OR: [{ userId }, { assignedToId: userId }],
        },
      }),
      prisma.otpToken.deleteMany({ where: { userId } }),
      prisma.orderItem.deleteMany({ where: { orderId: { in: deleteOrderIds } } }),
      prisma.order.deleteMany({ where: { id: { in: deleteOrderIds } } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/users/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
