"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";

const badgeColors = {
  bestseller: "bg-primary text-white",
  new: "bg-blue-500 text-white",
  sale: "bg-accent text-white",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all hover:shadow-lg hover:shadow-primary/5">
      {/* Badge */}
      {product.badge && (
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColors[product.badge as keyof typeof badgeColors] ?? "bg-muted text-white"}`}
        >
          {product.badge}
        </span>
      )}

      {/* Discount badge - Hidden as prices are removed */}
      {/* product.originalPrice && product.originalPrice > product.price && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
        </span>
      ) */}

      {/* Image area */}
      <Link
        href={`/shop/${product.id}`}
        className="relative flex h-48 items-center justify-center overflow-hidden bg-muted-light transition-colors group-hover:bg-primary-light/30"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.name} - ${product.brand} | Jovel Pharmacy`}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-105"
            unoptimized
            referrerPolicy="no-referrer"
          />
        ) : (
          <span 
            className="text-6xl transition-transform group-hover:scale-110"
            role="img"
            aria-label={`${product.name} icon`}
          >
            {product.emoji}
          </span>
        )}
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

        {/* Add Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4" /> Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
