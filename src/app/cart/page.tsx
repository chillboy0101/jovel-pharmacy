"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Your cart is empty
        </h1>
        <p className="mb-6 text-muted">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 35 ? 0 : 5.99;
  const total = totalPrice + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        Shopping Cart ({totalItems})
      </h1>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted-light">
                <span className="text-4xl">{item.product.emoji}</span>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted">
                      {item.product.brand}
                    </p>
                    <Link
                      href={`/shop/${item.product.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 text-muted hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="px-2 py-1 text-muted hover:text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="px-2 py-1 text-muted hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-foreground">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Order Summary
          </h2>

          {/* Promo */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Promo code"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-foreground/90">
              Apply
            </button>
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="font-medium text-primary">Free</span>
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

          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          {totalPrice < 35 && (
            <p className="mt-3 text-center text-xs text-muted">
              Add ${(35 - totalPrice).toFixed(2)} more for free shipping!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
