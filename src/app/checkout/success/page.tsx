"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Home } from "lucide-react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

type OrderInfo = {
  id: string;
  paymentStatus: "unpaid" | "pending" | "paid";
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const t = searchParams.get("t") ?? "";
  const tokenKey = orderId ? `order_token_${orderId}` : "";
  const token =
    t ||
    (typeof window !== "undefined" && tokenKey
      ? window.sessionStorage.getItem(tokenKey) ?? ""
      : "");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    if (!orderId) return;
    if (!t) return;
    try {
      window.sessionStorage.setItem(`order_token_${orderId}`, t);
      const url = new URL(window.location.href);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch {
      // ignore
    }
  }, [orderId, t]);

  useEffect(() => {
    if (!orderId) {
      window.setTimeout(() => setLoading(false), 0);
      return;
    }

    const url = token ? `/api/orders/${orderId}?t=${encodeURIComponent(token)}` : `/api/orders/${orderId}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: OrderInfo | null) => {
        setOrder(data);
        if (!data || data.paymentStatus !== "paid") {
          router.replace(`/checkout/pending?order_id=${orderId}`);
          return;
        }
      })
      .catch(() => {
        router.replace(`/checkout/pending?order_id=${orderId}`);
      })
      .finally(() => window.setTimeout(() => setLoading(false), 0));
  }, [orderId, router, token]);

  if (loading) return <PageLoader text="Verifying payment..." />;

  if (!orderId || !order || order.paymentStatus !== "paid") {
    return <PageLoader text="Waiting for payment confirmation..." />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      
      <h1 className="mb-2 text-3xl font-bold text-foreground">
        Payment Successful!
      </h1>
      <p className="mb-8 text-lg text-muted">
        Your order <strong>#{orderId?.slice(0, 8).toUpperCase()}</strong> has been confirmed. 
        A receipt has been sent to your email.
      </p>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link
          href={`/account/orders/${orderId}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-primary-dark shadow-lg shadow-primary/20"
        >
          <Package className="h-4 w-4" /> Track Your Order
        </Link>
        <Link
          href={`/receipt/${orderId}`}
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
        >
          Download Receipt
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
        >
          <Home className="h-4 w-4" /> Return Home
        </Link>
      </div>

      <div className="mt-12 rounded-2xl bg-muted-light/50 p-6 text-left">
        <h3 className="mb-2 text-sm font-bold text-foreground">Next Steps</h3>
        <ul className="space-y-3 text-sm text-muted">
          <li className="flex gap-2">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Our pharmacist will review your order items.
          </li>
          <li className="flex gap-2">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            You&apos;ll receive an email/SMS once your package is on its way.
          </li>
          <li className="flex gap-2">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Most deliveries are completed within 24-48 hours.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <SuccessContent />
    </Suspense>
  );
}
