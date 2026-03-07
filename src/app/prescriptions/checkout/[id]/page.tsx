"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Package, ArrowLeft, Loader2 } from "lucide-react";

type OrderInfo = {
  id: string;
  paymentStatus: "unpaid" | "pending" | "paid";
  paymentReference: string | null;
  paymentTransactionId: string | null;
  accessToken?: string;
};

type Recommendation = {
  id: string;
  name: string;
  price: number;
  emoji: string;
};

type Prescription = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  adminNotes: string | null;
};

export default function RecommendationCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"review" | "confirm" | "processing" | "success">("review");
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [error, setError] = useState("");
  const [momoMerchantId, setMomoMerchantId] = useState<string>("");
  const [momoMerchantName, setMomoMerchantName] = useState<string>("");
  const [txId, setTxId] = useState("");
  const [message, setMessage] = useState<string>("");

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

  useEffect(() => {
    fetch(`/api/prescriptions/${id}/public`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPrescription(data);
          // Parse recommendations
          try {
            if (data.adminNotes?.startsWith("{")) {
              const parsed = JSON.parse(data.adminNotes);
              setRecommendations(parsed.recommendations || []);
            }
          } catch (e) {
            console.error("Failed to parse recommendations", e);
          }
        }
      })
      .catch(() => setError("Failed to load recommendation details."))
      .finally(() => setLoading(false));
  }, [id]);

  const totalPrice = recommendations.reduce((sum, item) => sum + item.price, 0);
  const shipping = 5.99;
  const total = totalPrice + shipping;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prescription) return;

    const fd = new FormData(e.currentTarget);

    const nameParts = prescription.name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "Patient";
    const lastName = nameParts.slice(1).join(" ") || "Patient";
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: prescription.email,
          phone: prescription.phone,
          address: (fd.get("address") as string) || undefined,
          city: (fd.get("city") as string) || undefined,
          state: (fd.get("state") as string) || undefined,
          zip: (fd.get("zip") as string) || undefined,
          country: (fd.get("country") as string) || undefined,
          prescriptionId: prescription.id,
          items: recommendations.map((r) => ({
            productId: r.id,
            quantity: 1,
          })),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setOrderId(created.id);
        setOrder(created);
        setAccessToken((created as { accessToken?: string }).accessToken ?? "");
        if (created.paymentTransactionId) setTxId(created.paymentTransactionId);
        setStep("confirm");
      } else {
        const data = await res.json();
        setError(data.error || "Checkout failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted">Loading your recommendations...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Oops!</h1>
        <p className="mb-8 text-muted">{error || "We couldn't find those recommendations."}</p>
        <Link href="/shop" className="text-primary hover:underline">Return to Shop</Link>
      </div>
    );
  }

  async function handleConfirmPayment() {
    if (!orderId) return;
    setSubmitting(true);
    setMessage("");
    setError("");
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
      setStep("processing");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirm" || step === "processing") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Review & Pay</h1>
          <p className="mt-2 text-muted">Review the medications recommended by your pharmacist.</p>
        </div>

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
                <p className="mt-1 font-mono text-sm font-bold text-foreground">{order?.paymentReference ?? "—"}</p>
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

                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    disabled={submitting}
                    className="mt-3 w-full rounded-xl border border-border bg-white px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted-light disabled:opacity-50"
                  >
                    Recheck Items
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
            <div className="sticky top-24 rounded-2xl border border-border bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-foreground">Order Summary</h2>

              <div className="space-y-3 border-b border-border pb-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Patient</span>
                  <span className="font-medium text-foreground">{prescription.name}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Email</span>
                  <span className="font-medium text-foreground truncate ml-4">{prescription.email}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Phone</span>
                  <span className="font-medium text-foreground">{prescription.phone}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>GH₵{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery fee (flat rate for now)</span>
                  <span>GH₵{shipping.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-border pt-4 text-xl font-extrabold text-foreground">
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

  if (step === "success") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Payment Received!</h1>
        <p className="mb-2 text-muted">Thank you, {prescription.name}. Your order {orderId.slice(0, 12)} is confirmed.</p>
        <p className="mb-8 text-sm text-muted">A confirmation email has been sent to {prescription.email}.</p>
        <Link href="/" className="rounded-xl bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-dark">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Review & Pay</h1>
        <p className="mt-2 text-muted">Review the medications recommended by your pharmacist.</p>
      </div>

      <form onSubmit={handleCheckout} className="grid gap-10 lg:grid-cols-5">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <Package className="h-5 w-5 text-primary" /> Recommended Items
            </h2>
            <div className="divide-y divide-border">
              {recommendations.length === 0 ? (
                <p className="py-4 text-sm text-muted">No items recommended yet.</p>
              ) : (
                recommendations.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted-light text-3xl">
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                      <p className="text-xs text-muted">Qty: 1</p>
                    </div>
                    <span className="font-bold text-foreground">GH₵{item.price.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">Shipping Address</h2>
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
                placeholder="State / Region"
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
                defaultValue="Ghana"
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-foreground">Order Summary</h2>
            
            <div className="space-y-3 border-b border-border pb-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Patient</span>
                <span className="font-medium text-foreground">{prescription.name}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Email</span>
                <span className="font-medium text-foreground truncate ml-4">{prescription.email}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Phone</span>
                <span className="font-medium text-foreground">{prescription.phone}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>GH₵{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee (flat rate for now)</span>
                <span>GH₵{shipping.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-xl font-extrabold text-foreground">
                <span>Total</span>
                <span>GH₵{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || recommendations.length === 0}
              className="mt-8 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? "Processing..." : `Proceed with Payment — GH₵${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
