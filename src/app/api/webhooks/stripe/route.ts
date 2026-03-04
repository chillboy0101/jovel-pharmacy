import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24-preview" as unknown as Stripe.StripeConfig["apiVersion"],
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe or Webhook Secret not configured");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id || session.metadata?.orderId;

    if (orderId) {
      try {
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

        console.log(`Order ${orderId} updated to PAID and PROCESSING`);
      } catch (dbErr) {
        console.error(`Error updating order ${orderId}:`, dbErr);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
