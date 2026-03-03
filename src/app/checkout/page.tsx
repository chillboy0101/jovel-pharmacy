"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, CreditCard, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const shipping = totalPrice >= 35 ? 0 : 5.99;
  const total = totalPrice + shipping;

  if (step === "success") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Order Confirmed!
        </h1>
        <p className="mb-2 text-muted">
          Thank you for your purchase. Your order {orderId.slice(0, 12)} is being processed.
        </p>
        <p className="mb-8 text-sm text-muted">
          A confirmation email has been sent to your inbox.
        </p>
        <Link
          href="/shop"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
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
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError("");
            const fd = new FormData(e.currentTarget);
            try {
              const res = await fetch("/api/orders", {
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
              if (res.ok) {
                const order = await res.json();
                setOrderId(order.id);
                clearCart();
                setStep("success");
              } else {
                const data = await res.json();
                setError(data.error || "Failed to place order");
              }
            } catch {
              setError("Network error. Please try again.");
            }
            setSubmitting(false);
          }}
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
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
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
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input
                type="text"
                name="apt"
                placeholder="Apartment, suite, etc."
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="state"
                placeholder="State / Province"
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="zip"
                placeholder="ZIP / Postal code"
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="country"
                placeholder="Country"
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <CreditCard className="h-5 w-5" /> Payment
            </h2>
            <div className="rounded-xl border border-border bg-muted-light p-6 text-center">
              <Lock className="mx-auto mb-2 h-8 w-8 text-muted" />
              <p className="text-sm font-medium text-foreground">
                Stripe Payment Integration
              </p>
              <p className="text-xs text-muted">
                Secure payment processing will be connected here.
              </p>
            </div>
          </section>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? "Processing…" : `Place Order — $${total.toFixed(2)}`}
          </button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Your Order
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted-light text-2xl">
                    {item.product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-primary font-medium">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
