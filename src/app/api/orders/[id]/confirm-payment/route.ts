import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const confirmSchema = z.object({
  paymentTransactionId: z.string().min(3),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const data = confirmSchema.parse(body);

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        paymentStatus: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already confirmed" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (existing.paymentStatus === "unpaid") {
        const productIds = existing.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, name: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p] as const));

        for (const item of existing.items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new Error("Product not found");
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name} (${product.stock} available)`);
          }
        }

        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          paymentTransactionId: data.paymentTransactionId,
          paymentStatus: "pending",
        },
        select: {
          id: true,
          paymentStatus: true,
          paymentReference: true,
          paymentTransactionId: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Insufficient stock")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/orders/[id]/confirm-payment POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
