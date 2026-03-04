import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Paystack is not configured" }, { status: 500 });
  }

  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Paystack uses amounts in kobo/pesewas (multiply by 100)
    const amount = Math.round(order.total * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.email,
        amount: amount,
        currency: "GHS", // Set to Ghana Cedis
        reference: `ORD-${order.id.slice(0, 8)}-${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?order_id=${orderId}`,
        metadata: {
          orderId: order.id,
          firstName: order.firstName,
          lastName: order.lastName,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Paystack initialization failed" }, { status: 400 });
    }

    // Update order with paymentReference
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentReference: data.data.reference },
    });

    return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    console.error("[Paystack Checkout] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
