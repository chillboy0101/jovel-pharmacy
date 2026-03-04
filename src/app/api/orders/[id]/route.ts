import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendReceiptEmail } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";

const updateSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
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

    const updateData: any = { status: data.status };
    if (data.status === "shipped") updateData.shippedAt = new Date();
    if (data.status === "delivered") updateData.deliveredAt = new Date();

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, emoji: true }
            }
          }
        }
      }
    });

    // Send status notifications (Mock)
    try {
      if (data.status === "shipped") {
        await sendReceiptEmail(order, 'ORDER_SHIPPED');
        if (order.phone) {
          await sendSMSNotification(order.phone, `Jovel Pharmacy: Order #${order.id.slice(0, 8).toUpperCase()} has been shipped!`);
        }
      } else if (data.status === "delivered") {
        await sendReceiptEmail(order, 'ORDER_DELIVERED');
        if (order.phone) {
          await sendSMSNotification(order.phone, `Jovel Pharmacy: Order #${order.id.slice(0, 8).toUpperCase()} has been delivered!`);
        }
      } else if (data.status === "cancelled") {
        await sendReceiptEmail(order, 'ORDER_CANCELLED');
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
