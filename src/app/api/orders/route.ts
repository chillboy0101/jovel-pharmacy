import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createOrderAccessToken } from "@/lib/orderAccess";
import { readSiteSettings } from "@/lib/siteSettings";

type ProductRow = {
  id: string;
  name: string;
  stock: number;
  price: number;
  costPrice?: number;
};

const orderSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  pickupMethod: z.string().optional(),
  deliveryZoneId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  prescriptionId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
}).superRefine((val, ctx) => {
  const pickupMethod = (val.pickupMethod ?? "").toLowerCase();
  const isInStorePickup =
    pickupMethod.includes("in-store") || pickupMethod.includes("pickup") || pickupMethod === "in_store";

  if (!isInStorePickup) {
    if (!val.deliveryZoneId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Delivery zone is required" });
    }
    if (!val.address) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Delivery address is required" });
    }
    if (!val.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "City/Town is required" });
    }
  }
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const data = orderSchema.parse(body);

    // Fetch products and validate stock
    const productIds = data.items.map((i) => i.productId);
    const products = (await prisma.product.findMany({
      where: { id: { in: productIds } },
    })) as ProductRow[];

    const productMap = new Map<string, ProductRow>(
      products.map((p) => [p.id, p] as const),
    );

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 },
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} (${product.stock} available)`,
          },
          { status: 400 },
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        costPrice: (product as unknown as { costPrice?: number }).costPrice || 0,
      };
    });

    const pickupMethod = (data.pickupMethod ?? "").toLowerCase();
    const isInStorePickup =
      pickupMethod.includes("in-store") ||
      pickupMethod.includes("pickup") ||
      pickupMethod === "in_store";

    let shipping = 0;
    if (!isInStorePickup) {
      const settings = await readSiteSettings();
      const zones = Array.isArray(settings.deliveryZones) ? settings.deliveryZones : [];
      const zone = zones.find((z) => z.enabled && z.id === data.deliveryZoneId);
      shipping = zone ? zone.rate : 0;
    }
    const total = subtotal + shipping;

    // Create order as unpaid (do NOT decrement stock yet; stock is reserved when payment is confirmed)
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        status: "pending",
        paymentStatus: "unpaid",
        paymentReference: null,
        total,
        shipping,
        ...(data.prescriptionId ? ({ prescriptionId: data.prescriptionId } as { prescriptionId: string }) : {}),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        state: isInStorePickup ? "in_store" : data.state,
        address: isInStorePickup ? null : data.address,
        city: isInStorePickup ? null : data.city,
        zip: isInStorePickup ? null : data.zip,
        country: isInStorePickup ? null : data.country,
        items: { create: orderItems },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, emoji: true, imageUrl: true },
            },
          },
        },
      },
    });

    const systemRef = `ORD-${String(order.id).slice(0, 8).toUpperCase()}`;
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: systemRef },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, emoji: true, imageUrl: true },
            },
          },
        },
      },
    });

    const accessToken = createOrderAccessToken(updated.id);
    return NextResponse.json({ ...updated, accessToken }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { product: { select: { name: true, emoji: true, imageUrl: true } } } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error("[/api/orders GET]", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
