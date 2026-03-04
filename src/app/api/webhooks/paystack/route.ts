import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";
import crypto from "crypto";

export async function POST(req: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("Paystack Secret Key not configured");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  try {
    const body = await req.text();
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(body)
      .digest("hex");

    const signature = req.headers.get("x-paystack-signature");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const metadata = event.data.metadata;
      const orderId = metadata?.orderId;

      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: "paid",
            status: "processing" 
          },
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

        // Send actual receipt email now that payment is confirmed
        await sendReceiptEmail(order, 'ORDER_CONFIRMED');
        
        if (order.phone) {
          await sendSMSNotification(
            order.phone,
            `Jovel Pharmacy: Payment received for Order #${order.id.slice(0, 8).toUpperCase()}. We are now processing your items!`
          );
        }

        console.log(`Order ${orderId} updated to PAID via Paystack webhook`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paystack Webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
