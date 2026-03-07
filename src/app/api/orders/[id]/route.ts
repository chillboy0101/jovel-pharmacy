import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendReceiptEmail } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";
import { verifyOrderAccessToken } from "@/lib/orderAccess";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get("t");
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        total: true,
        shipping: true,
        status: true,
        paymentStatus: true,
        paymentReference: true,
        paymentTransactionId: true,
        prescriptionId: true,
        shippedAt: true,
        deliveredAt: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        userId: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: { name: true, emoji: true },
            },
          },
        },
      } as any,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAdmin = session?.user?.role === "ADMIN";
    const orderUserId = (order as unknown as { userId?: string | null }).userId ?? null;
    const sessionUserId = (session?.user as unknown as { id?: string | null } | undefined)?.id ?? null;
    const isOwner = !!sessionUserId && orderUserId === sessionUserId;
    const hasToken = !!accessToken && verifyOrderAccessToken(accessToken, id).ok;

    if (!isAdmin && !isOwner && !hasToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: _userId, ...safeOrder } = order;

    return NextResponse.json(safeOrder);
  } catch (err) {
    console.error("[/api/orders/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "pending", "paid"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paymentStatus: true, phone: true, total: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      existing.paymentStatus === "paid" &&
      data.paymentStatus &&
      data.paymentStatus !== "paid"
    ) {
      return NextResponse.json(
        { error: "Paid orders cannot be marked unpaid" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "shipped") updateData.shippedAt = new Date();
      if (data.status === "delivered") updateData.deliveredAt = new Date();
    }

    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
      if (data.paymentStatus === "paid" && existing.status === "pending") {
        updateData.status = "processing";
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, emoji: true },
            },
          },
        },
      },
    });

    // Notifications
    try {
      if (data.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
        await sendReceiptEmail(order, "ORDER_CONFIRMED");
        if (order.phone) {
          await sendSMSNotification(
            order.phone,
            `Jovel Pharmacy: Payment confirmed for Order #${order.id.slice(0, 8).toUpperCase()}. Total: GH₵${order.total.toFixed(2)}.`,
          );
        }
      }

      if (data.status === "shipped") {
        await sendReceiptEmail(order, "ORDER_SHIPPED");
        if (order.phone) {
          await sendSMSNotification(
            order.phone,
            `Jovel Pharmacy: Order #${order.id.slice(0, 8).toUpperCase()} has been shipped!`,
          );
        }
      } else if (data.status === "delivered") {
        await sendReceiptEmail(order, "ORDER_DELIVERED");
        if (order.phone) {
          await sendSMSNotification(
            order.phone,
            `Jovel Pharmacy: Order #${order.id.slice(0, 8).toUpperCase()} has been delivered!`,
          );
        }
      } else if (data.status === "cancelled") {
        await sendReceiptEmail(order, "ORDER_CANCELLED");
      }
    } catch (notifyErr) {
      console.error("Status notification failed:", notifyErr);
    }

    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/orders/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ops: any[] = [];

    if (order.paymentStatus !== "unpaid") {
      ops.push(
        ...order.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );
    }

    ops.push(prisma.order.delete({ where: { id } }));

    await prisma.$transaction(ops);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/orders/[id] DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
