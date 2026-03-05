"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Lock, Package, ArrowLeft, Loader2 } from "lucide-react";

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
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"review" | "success">("review");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: prescription.name.split(" ")[0],
          lastName: prescription.name.split(" ").slice(1).join(" ") || "Patient",
          email: prescription.email,
          phone: prescription.phone,
          items: recommendations.map((r) => ({
            productId: r.id,
            quantity: 1,
          })),
          prescriptionId: id, // Link the order to the prescription
        }),
      });

      if (res.ok) {
        const order = await res.json();
        setOrderId(order.id);
        setStep("success");
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

      <div className="grid gap-10 lg:grid-cols-5">
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
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h2>
            <div className="rounded-xl border border-border bg-muted-light p-8 text-center">
              <Lock className="mx-auto mb-3 h-10 w-10 text-muted" />
              <p className="text-sm font-semibold text-foreground">Stripe Payment Integration</p>
              <p className="mt-1 text-xs text-muted">Your payment is encrypted and secure.</p>
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
              onClick={handleCheckout}
              disabled={submitting || recommendations.length === 0}
              className="mt-8 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? "Processing..." : `Pay Now — GH₵${total.toFixed(2)}`}
            </button>
            
            <p className="mt-4 text-center text-[10px] text-muted uppercase tracking-widest font-semibold">
              <Lock className="inline-inline mr-1 h-3 w-3" /> Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
