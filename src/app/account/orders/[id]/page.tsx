"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
  product: { name: string; emoji: string; imageUrl?: string | null };
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
  country: string | null;
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
  const tokenKey = `order_token_${id}`;
  const token =
    t ||
    (typeof window !== "undefined" ? window.sessionStorage.getItem(tokenKey) ?? "" : "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFinalStatus = (status: string) => {
    return status === "delivered" || status === "cancelled";
  };

  useEffect(() => {
    if (!t) return;
    try {
      window.sessionStorage.setItem(tokenKey, t);
      const url = new URL(window.location.href);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch {
      // ignore
    }
  }, [t, tokenKey]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async () => {
      try {
        const url = token ? `/api/orders/${id}?t=${encodeURIComponent(token)}` : `/api/orders/${id}`;
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
  }, [id, token]);

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

  const normalizeAddressPart = (value?: string | null) => {
    const v = (value ?? "").trim();
    if (!v) return "";
    const upper = v.toUpperCase();
    if (upper === "N/A" || upper === "NA") return "";
    return v;
  };

  const addressLine1 = normalizeAddressPart(order.address);
  const addressLine2 = [order.city, order.state, order.zip]
    .map(normalizeAddressPart)
    .filter(Boolean)
    .join(", ");
  const addressLine3 = normalizeAddressPart(order.country);
  const addressLines = [addressLine1, addressLine2, addressLine3].filter(Boolean);
  const isInStorePickup = normalizeAddressPart(order.state).toLowerCase() === "in_store";
  const includeItems = order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Track Order
          </h1>
          <p className="text-sm text-muted">Order #{order.id.toUpperCase()}</p>
        </div>
        <div className="sm:text-right">
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
        <div className="mb-12 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="relative flex w-[520px] justify-between sm:w-auto">
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
              href={`/receipt/${order.id}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              Download Receipt
            </Link>
          </div>

          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mx-auto max-w-[600px]">
              <h2 className="text-center text-xl font-bold text-primary">Jovel Pharmacy</h2>
              <div className="my-5 border-t border-border" />

              <div className="rounded-xl bg-muted-light/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Order Summary</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="font-semibold text-foreground">Order ID:</span> #{order.id.toUpperCase()}</p>
                  <p><span className="font-semibold text-foreground">Status:</span> {order.status.toUpperCase()}</p>
                  <p><span className="font-semibold text-foreground">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {includeItems && (
                <>
                  <h3 className="mt-6 text-base font-bold text-foreground">Items</h3>
                  <div className="mt-3 space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.product.imageUrl ? (
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-contain"
                              sizes="36px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
                            <span className="text-lg leading-none">{item.product.emoji}</span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-foreground">{item.product.name}</div>
                          <div className="text-xs text-muted">Qty: {item.quantity}</div>
                        </div>
                        <div className="shrink-0 whitespace-nowrap font-bold text-foreground">GH₵{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-6 border-t border-border pt-4 text-right">
                <p className="text-sm text-muted">Shipping: GH₵{order.shipping.toFixed(2)}</p>
                <p className="mt-1 text-lg font-bold text-foreground">Total Paid: GH₵{order.total.toFixed(2)}</p>
              </div>

              <div className="mt-6 rounded-xl bg-amber-50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">Delivery Address</h3>
                <div className="mt-2 text-sm text-amber-800">
                  {isInStorePickup ? (
                    <p>In-store pickup</p>
                  ) : addressLines.length > 0 ? (
                    addressLines.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))
                  ) : (
                    <p>Delivery address not provided</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
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
