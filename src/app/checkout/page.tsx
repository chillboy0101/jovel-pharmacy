"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, CreditCard, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const shipping = 5.99;
  const total = totalPrice + shipping;

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
      
      // 2. Initiate Stripe Checkout
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json();
        throw new Error(data.error || "Stripe configuration error");
      }

      const { url } = await checkoutRes.json();
      
      // Clear cart before redirecting
      clearCart();
      
      // 3. Redirect to Stripe
      window.location.href = url;
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step === "form") {
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

          {/* Payment Info */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <CreditCard className="h-5 w-5" /> Payment Method
            </h2>
            <div className="rounded-2xl border-2 border-primary bg-primary-light/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 font-bold text-primary">
                  <Lock className="h-4 w-4" /> Secure Paystack Payment
                </span>
                <div className="flex gap-2 text-muted-foreground font-bold text-xs">
                  MTN MoMo / Telecel / Card
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                After clicking the button below, you will be redirected to Paystack to securely complete your purchase using Mobile Money or Card.
              </p>
            </div>
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
            {submitting ? "Preparing Secure Checkout..." : `Pay GH₵${total.toFixed(2)}`}
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
