"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

const badgeColors = {
  bestseller: "bg-primary text-white",
  new: "bg-blue-500 text-white",
  sale: "bg-accent text-white",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg hover:shadow-primary/5 ${outOfStock ? "border-border opacity-70" : "border-border"}`}>
      {/* Badge */}
      {product.badge && !outOfStock && (
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColors[product.badge as keyof typeof badgeColors] ?? "bg-muted text-white"}`}
        >
          {product.badge}
        </span>
      )}
      {outOfStock && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
          Out of Stock
        </span>
      )}

      {/* Image area */}
      <Link
        href={`/shop/${product.id}`}
        className="flex h-48 items-center justify-center bg-muted-light transition-colors group-hover:bg-primary-light/30"
      >
        <span className={`text-6xl transition-transform ${outOfStock ? "" : "group-hover:scale-110"}`}>
          {product.emoji}
        </span>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
          {product.brand}
        </p>
        <Link
          href={`/shop/${product.id}`}
          className="mb-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.floor(product.rating)
                  ? "fill-accent text-accent"
                  : "fill-muted-light text-muted-light"
              }`}
            />
          ))}
          <span className="ml-1 text-xs text-muted">({product.reviews})</span>
        </div>

        {lowStock && (
          <p className="mb-2 text-[11px] font-semibold text-amber-600">
            Only {product.stock} left!
          </p>
        )}

        {/* Price + Add */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (!outOfStock) {
                addItem(product);
                toast(`${product.name} added to cart`);
              }
            }}
            disabled={outOfStock}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
            aria-label={outOfStock ? "Out of stock" : `Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
