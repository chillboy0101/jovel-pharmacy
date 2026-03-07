"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Printer, ArrowLeft, AlertCircle } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type OrderItem = {
  quantity: number;
  price: number;
  product: { name: string; emoji: string };
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  shipping: number;
  status: string;
  paymentStatus: "unpaid" | "pending" | "paid";
  paymentReference: string | null;
  paymentTransactionId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  items: OrderItem[];
};

function ReceiptContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const t = searchParams.get("t") ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const createdAt = useMemo(() => {
    if (!order?.createdAt) return null;
    const dt = new Date(order.createdAt);
    return dt;
  }, [order?.createdAt]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const url = t ? `/api/orders/${id}?t=${encodeURIComponent(t)}` : `/api/orders/${id}`;
        const r = await fetch(url, { cache: "no-store" });
        if (r.status === 401) {
          setError("Unauthorized");
          setOrder(null);
          return;
        }
        if (!r.ok) {
          setError("Order not found");
          setOrder(null);
          return;
        }
        const data = (await r.json()) as Order;
        if (cancelled) return;
        setOrder(data);
        setError("");
      } catch {
        if (cancelled) return;
        setError("Failed to load receipt");
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) return <PageLoader text="Preparing receipt..." />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">
          {error === "Unauthorized" ? "Access Denied" : "Receipt Unavailable"}
        </h1>
        <p className="mb-8 text-muted">
          {error === "Unauthorized"
            ? "This receipt is protected. Please open it from your receipt link or sign in to your account."
            : "We couldn't load this receipt. Please check the link and try again."}
        </p>
        <Link href="/account" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">
          Go to My Account
        </Link>
      </div>
    );
  }

  const subtotal = Math.max(0, order.total - order.shipping);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }
          html,
          body {
            background: white !important;
          }
          .receipt-print {
            box-shadow: none !important;
            border: 0 !important;
          }
          .receipt-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .receipt-tight {
            margin-top: 0 !important;
          }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={t ? `/account/orders/${order.id}?t=${encodeURIComponent(t)}` : `/account/orders/${order.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted-light"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tracking
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      <div className="receipt-print rounded-2xl border border-border bg-white p-6 shadow-sm print:p-0 print:border-0 print:shadow-none">
        <div className="receipt-avoid-break flex items-start justify-between gap-6">
          <Image
            src="/logo-transparent.png"
            alt="Jovel Pharmacy"
            width={160}
            height={48}
            priority
            className="h-10 w-auto object-contain"
          />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Receipt</p>
            <p className="mt-1 text-xs font-bold text-foreground">#{order.id.slice(0, 12).toUpperCase()}</p>
            {createdAt && (
              <p className="mt-1 text-[10px] text-muted">
                {createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="receipt-tight mt-5 grid gap-3">
          <div className="receipt-avoid-break rounded-xl border border-border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Payment</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <span className="font-semibold capitalize text-foreground">{order.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Reference</span>
                <span className="font-mono text-[11px] font-semibold text-foreground break-all">{order.paymentReference ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Transaction</span>
                <span className="font-mono text-[11px] font-semibold text-foreground break-all">{order.paymentTransactionId ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="receipt-avoid-break rounded-xl border border-border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Delivery</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Order Status</span>
                <span className="font-semibold capitalize text-foreground">
                  {order.status === "shipped" ? "On Route" : order.status}
                </span>
              </div>
              <div>
                <p className="text-muted">Shipping Address</p>
                <p className="mt-1 text-foreground">
                  {order.address ? (
                    <>
                      {order.address}
                      <br />
                      {[order.city, order.state, order.zip].filter(Boolean).join(", ")}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Items</h2>
            <p className="text-xs text-muted">{order.items.length} item(s)</p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-12 bg-muted-light/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 px-5 py-4 text-sm">
                  <div className="col-span-7 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted-light text-lg">
                      {item.product.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted">GH₵{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-semibold text-foreground">{item.quantity}</div>
                  <div className="col-span-3 text-right font-bold text-foreground">
                    GH₵{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="receipt-avoid-break mt-5 rounded-xl border border-border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Totals</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-foreground">GH₵{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-semibold text-foreground">GH₵{order.shipping.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-foreground">GH₵{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-muted-light/40 p-3 text-center text-[10px] text-muted">
            Thank you for your business
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading receipt..." />}>
      <ReceiptContent />
    </Suspense>
  );
}
