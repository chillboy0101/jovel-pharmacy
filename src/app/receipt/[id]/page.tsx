"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, AlertCircle } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { buildReceiptEmailHtml, type ReceiptTemplateOrder } from "@/lib/receiptTemplate";

type OrderItem = {
  quantity: number;
  price: number;
  product: { name: string; emoji: string; imageUrl?: string | null };
};

type Order = {
  id: string;
  firstName?: string | null;
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
  country?: string | null;
  items: OrderItem[];
};

function ReceiptContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const t = searchParams.get("t") ?? "";
  const tokenKey = `order_token_${id}`;
  const token =
    t ||
    (typeof window !== "undefined" ? window.sessionStorage.getItem(tokenKey) ?? "" : "");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const run = async () => {
      try {
        const url = token ? `/api/orders/${id}?t=${encodeURIComponent(token)}` : `/api/orders/${id}`;
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
  }, [id, token]);

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

  const receiptHtml = useMemo(() => {
    const baseUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000";

    const receiptOrder: ReceiptTemplateOrder = {
      id: order.id,
      firstName: order.firstName,
      status: order.status,
      createdAt: order.createdAt,
      shipping: order.shipping,
      total: order.total,
      address: order.address,
      city: order.city,
      state: order.state,
      zip: order.zip,
      country: order.country,
      items: order.items,
    };

    return buildReceiptEmailHtml({
      order: receiptOrder,
      type: "ORDER_CONFIRMED",
      baseUrl,
    });
  }, [order]);

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
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
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

      <div className="receipt-print" dangerouslySetInnerHTML={{ __html: receiptHtml }} />
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
