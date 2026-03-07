"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, Package, ArrowRight, Home } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type Settings = { momoMerchantId?: string };

type OrderInfo = {
  id: string;
  paymentStatus: "unpaid" | "pending" | "paid";
  paymentReference: string | null;
  paymentTransactionId: string | null;
};

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const [loading, setLoading] = useState(true);
  const [momoMerchantId, setMomoMerchantId] = useState<string>("");
  const [momoMerchantName, setMomoMerchantName] = useState<string>("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/momo")
      .then((r) => (r.ok ? r.json() : ({} as Settings)))
      .then((data: Settings & { momoMerchantName?: string }) => {
        setMomoMerchantId(data.momoMerchantId ?? "");
        setMomoMerchantName(data.momoMerchantName ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: OrderInfo | null) => {
        if (data) {
          setOrder(data);
        }
      })
      .catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    if (order?.paymentStatus === "paid") {
      router.replace(`/checkout/success?order_id=${orderId}`);
      return;
    }

    const interval = setInterval(() => {
      fetch(`/api/orders/${orderId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: OrderInfo | null) => {
          if (!data) return;
          setOrder(data);
          if (data.paymentStatus === "paid") {
            router.replace(`/checkout/success?order_id=${orderId}`);
          }
        })
        .catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [orderId, order?.paymentStatus, router]);

  if (loading) return <PageLoader text="Submitting order..." />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
        <Clock className="h-10 w-10" />
      </div>

      <h1 className="mb-2 text-3xl font-bold text-foreground">Order Received</h1>
      <p className="mb-8 text-lg text-muted">
        Your order <strong>#{orderId?.slice(0, 8).toUpperCase()}</strong> is being processed.
      </p>

      <div className="w-full rounded-2xl border border-border bg-white p-6 text-left shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-foreground">Payment Status</h2>
        <p className="text-sm text-muted">
          {order?.paymentStatus === "unpaid"
            ? "Payment has not been confirmed yet. Please return to checkout to submit your MoMo transaction ID."
            : "Payment is being verified. Once an admin approves it, your order will move to processing and you’ll see the success page."}
        </p>

        {order?.paymentStatus !== "unpaid" && (
          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center gap-3 text-primary">
              <Clock className="h-5 w-5" />
              <p className="text-sm font-semibold text-foreground">Payment is being processed</p>
            </div>
            <p className="mt-2 text-sm text-muted">{message || "Waiting for admin approval..."}</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        {orderId && (
          <Link
            href={`/account/orders/${orderId}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-primary-dark shadow-lg shadow-primary/20"
          >
            <Package className="h-4 w-4" /> Track Your Order
          </Link>
        )}
        {order?.paymentStatus === "unpaid" ? (
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
          >
            Return to Checkout
          </Link>
        ) : (
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
        >
          <Home className="h-4 w-4" /> Return Home
        </Link>
        )}
      </div>

      <Link
        href="/shop"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        Continue Shopping <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <PendingContent />
    </Suspense>
  );
}
