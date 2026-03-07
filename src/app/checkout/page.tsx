"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

type OrderInfo = {
  id: string;
  paymentStatus: "unpaid" | "pending" | "paid";
  paymentReference: string | null;
  paymentTransactionId: string | null;
  accessToken?: string;
};

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"details" | "confirm" | "processing">("details");
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [snapshotItems, setSnapshotItems] = useState<typeof items>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [momoMerchantId, setMomoMerchantId] = useState<string>("");
  const [momoMerchantName, setMomoMerchantName] = useState<string>("");
  const [txId, setTxId] = useState("");
  const [message, setMessage] = useState<string>("");
  const shipping = 5.99;
  const total = totalPrice + shipping;

  const canConfirm = useMemo(() => {
    return !!orderId && !!txId.trim() && !submitting && (order?.paymentStatus ?? "unpaid") !== "paid";
  }, [orderId, txId, submitting, order?.paymentStatus]);

  useEffect(() => {
    if (step !== "processing") return;
    if (!orderId) return;

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [orderId, step]);

  useEffect(() => {
    fetch("/api/settings/momo")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { momoMerchantId?: string; momoMerchantName?: string }) => {
        setMomoMerchantId(data.momoMerchantId ?? "");
        setMomoMerchantName(data.momoMerchantName ?? "");
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    
    try {
      // 1. Create the order first
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fd.get("firstName") as string,
          lastName: fd.get("lastName") as string,
          email: fd.get("email") as string,
          phone: (fd.get("phone") as string) || undefined,
          address: (fd.get("address") as string) || undefined,
          city: (fd.get("city") as string) || undefined,
          state: (fd.get("state") as string) || undefined,
          zip: (fd.get("zip") as string) || undefined,
          country: (fd.get("country") as string) || undefined,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error || "Failed to place order");
      }

      const order = await orderRes.json();

      setSnapshotItems(items);

      setOrderId(order.id);
      setOrder(order);
      setAccessToken((order as { accessToken?: string }).accessToken ?? "");
      if (order.paymentTransactionId) setTxId(order.paymentTransactionId);
      setStep("confirm");
      setSubmitting(false);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setSubmitting(false);
    }
  };

  async function handleConfirmPayment() {
    if (!orderId) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTransactionId: txId.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to confirm payment.");
        return;
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: (data as OrderInfo).paymentStatus ?? prev.paymentStatus,
              paymentTransactionId:
                (data as OrderInfo).paymentTransactionId ?? prev.paymentTransactionId,
            }
          : (data as OrderInfo),
      );

      clearCart();
      setStep("processing");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step !== "processing") return;
    if (!orderId) return;

    setMessage("Payment is being processed. Waiting for admin approval...");
    const interval = setInterval(() => {
      const url = accessToken
        ? `/api/orders/${orderId}?t=${encodeURIComponent(accessToken)}`
        : `/api/orders/${orderId}`;
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: OrderInfo | null) => {
          if (!data) return;
          setOrder(data);
          if (data.paymentStatus === "paid") {
            const q = accessToken ? `?order_id=${orderId}&t=${encodeURIComponent(accessToken)}` : `?order_id=${orderId}`;
            router.replace(`/checkout/success${q}`);
          }
        })
        .catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [accessToken, orderId, router, step]);

  if (items.length === 0 && step === "details") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <p className="mb-4 text-xl font-semibold">Nothing to checkout</p>
        <Link
          href="/shop"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Shop
        </Link>
      </div>
    );
  }

  if (step === "confirm" || step === "processing") {
    const summaryItems = snapshotItems.length > 0 ? snapshotItems : items;

    return (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Payment (MTN MoMo)</h2>
              <p className="text-sm text-muted">
                Pay to the Merchant ID below. Use the payment reference shown here so we can match your payment.
              </p>

              <div className="mt-4 rounded-xl border border-border bg-muted-light/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Merchant ID</p>
                <p className="mt-1 font-mono text-sm font-bold text-foreground">
                  {momoMerchantId ? momoMerchantId : "Not set"}
                </p>
                {momoMerchantName && (
                  <p className="mt-2 text-xs font-semibold text-foreground">{momoMerchantName}</p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Payment Reference (use this when paying)
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-foreground">
                  {order?.paymentReference ?? "—"}
                </p>
              </div>

              {step === "confirm" ? (
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold text-foreground">MoMo Transaction ID</label>
                  <input
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base sm:text-sm outline-none focus:border-primary"
                  />

                  {error && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      ✕ {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={!canConfirm}
                    className="mt-3 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Confirm Payment"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Clock className="h-5 w-5" />
                    <p className="text-sm font-semibold text-foreground">Payment is being processed</p>
                  </div>
                  <p className="mt-2 text-sm text-muted">{message || "Waiting for admin approval..."}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {orderId && (
                <Link
                  href={accessToken ? `/account/orders/${orderId}?t=${encodeURIComponent(accessToken)}` : `/account/orders/${orderId}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-primary-dark shadow-lg shadow-primary/20"
                >
                  <Package className="h-4 w-4" /> Track Your Order
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
              >
                Return Home
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-3xl border border-border bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-foreground">Order Summary</h2>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {summaryItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted-light text-2xl">
                      {item.product.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-foreground leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      GH₵{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3 border-t border-border pt-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">GH₵{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery fee (flat rate for now)</span>
                  <span className="font-medium text-foreground">GH₵{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4 text-xl font-black text-foreground">
                  <span>Total</span>
                  <span>GH₵{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        Checkout
      </h1>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Form */}
        <form
          id="checkout-form"
          onSubmit={handleCheckout}
          className="lg:col-span-3 space-y-8"
        >
          {/* Contact */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Contact Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Shipping Address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="address"
                placeholder="Street address"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="state"
                placeholder="State / Province"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="zip"
                placeholder="ZIP / Postal code"
                required
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="country"
                placeholder="Country"
                required
                defaultValue="USA"
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Payment</h2>
          </section>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {submitting ? "Submitting..." : `Proceed with Payment — GH₵${total.toFixed(2)}`}
            <ArrowRight className={`h-4 w-4 transition-transform ${submitting ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1'}`} />
          </button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-3xl border border-border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-foreground">
              Order Summary
            </h2>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted-light text-2xl">
                    {item.product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-foreground leading-tight">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    GH₵{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 space-y-3 border-t border-border pt-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">GH₵{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery fee (flat rate for now)</span>
                <span className="font-medium text-foreground">
                  GH₵{shipping.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 text-xl font-black text-foreground">
                <span>Total</span>
                <span>GH₵{total.toFixed(2)}</span>
              </div>
            </div>
            
            <p className="mt-6 text-[10px] text-center text-muted-foreground">
              Tax is calculated at checkout based on your location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
