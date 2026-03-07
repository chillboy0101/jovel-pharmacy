"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  MapPin, 
  Calendar,
  AlertCircle
} from "lucide-react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";

type OrderItem = {
  quantity: number;
  price: number;
  product: { name: string; emoji: string };
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
  shipping: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

const statusSteps = [
  { id: "pending", label: "Order Placed", icon: Clock },
  { id: "processing", label: "Processing", icon: Package },
  { id: "shipped", label: "On Route", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = searchParams.get("t") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFinalStatus = (status: string) => {
    return status === "delivered" || status === "cancelled";
  };

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async () => {
      try {
        const url = t ? `/api/orders/${id}?t=${encodeURIComponent(t)}` : `/api/orders/${id}`;
        const r = await fetch(url, { cache: "no-store" });
        if (r.status === 401) throw new Error("Unauthorized");
        if (!r.ok) throw new Error("Order not found");
        const data = (await r.json()) as Order;
        if (cancelled) return;
        setOrder(data);
        setError("");

        if (isFinalStatus(data.status) && interval) {
          clearInterval(interval);
          interval = null;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    interval = setInterval(fetchOrder, 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [id, t]);

  if (loading) return <PageLoader text="Locating your order..." />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">{error === "Unauthorized" ? "Access Denied" : "Order Not Found"}</h1>
        <p className="mb-8 text-muted">
          {error === "Unauthorized"
            ? "This order is protected. Please open it from your receipt link or sign in to your account."
            : "We couldn&apos;t find the order you&apos;re looking for. It might be private or the ID is incorrect."}
        </p>
        <Link href="/account" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">
          Back to My Account
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(s => s.id === order.status);
  // If cancelled or unknown, we handle separately
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Track Order
          </h1>
          <p className="text-sm text-muted">Order #{order.id.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted">Status</p>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold capitalize ${
            isCancelled ? "bg-red-100 text-red-600" : "bg-primary-light text-primary"
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      {isDelivered && (
        <div className="mb-10 rounded-3xl border border-primary/15 bg-primary-light/40 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Thank you for shopping with Jovel Pharmacy</h2>
              <p className="mt-1 text-sm text-muted">
                Your order has been delivered. We appreciate your trust and hope you enjoy your purchase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="mb-12 rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="relative flex justify-between">
            {/* Background Line */}
            <div className="absolute left-0 top-5 h-0.5 w-full bg-muted-light" />
            
            {/* Active Line */}
            <div 
              className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-500" 
              style={{ width: `${(Math.max(0, currentStatusIndex) / (statusSteps.length - 1)) * 100}%` }}
            />

            {statusSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;

              return (
                <div key={step.id} className="relative flex flex-col items-center text-center">
                  <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted ? "border-primary bg-primary text-white" : "border-muted-light bg-white text-muted"
                  } ${isCurrent ? "ring-4 ring-primary-light" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-3 text-[10px] font-bold uppercase tracking-wider md:text-xs ${
                    isCompleted ? "text-foreground" : "text-muted"
                  }`}>
                    {step.label}
                  </p>
                  {step.id === 'shipped' && order.shippedAt && (
                    <p className="mt-1 text-[10px] text-muted">{new Date(order.shippedAt).toLocaleDateString()}</p>
                  )}
                  {step.id === 'delivered' && order.deliveredAt && (
                    <p className="mt-1 text-[10px] text-muted">{new Date(order.deliveredAt).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-12 rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-500" />
          <h2 className="text-lg font-bold text-red-700">Order Cancelled</h2>
          <p className="text-sm text-red-600">This order was cancelled. Please contact support if you have questions.</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={t ? `/receipt/${order.id}?t=${encodeURIComponent(t)}` : `/receipt/${order.id}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              Download Receipt
            </Link>
          </div>
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted-light text-2xl">
                    {item.product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{item.product.name}</p>
                    <p className="text-sm text-muted">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-foreground">GH₵{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>GH₵{(order.total - order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "Free" : `GH₵${order.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2">
                <span>Total Paid</span>
                <span>GH₵{order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">Shipping Address</h2>
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm text-foreground/80 leading-relaxed">
                {order.address}<br />
                {order.city}, {order.state} {order.zip}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">Order Date</h2>
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm text-foreground/80">
                {new Date(order.createdAt).toLocaleDateString("en-US", { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
