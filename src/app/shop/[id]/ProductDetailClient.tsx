"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import type { Category, Product } from "@/lib/types";

type ProductDetailClientProps = {
  product: Product;
  categories: Category[];
  related: Product[];
  displayDescription: string;
};

export default function ProductDetailClient({
  product,
  categories,
  related,
  displayDescription,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
        <Link href="/shop" className="flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Shop
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/shop?cat=${category.id}`} className="hover:text-primary">
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-muted-light p-6 sm:aspect-[16/10] sm:p-10 lg:aspect-square lg:p-16">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-4 sm:p-8"
              sizes="(max-width: 1024px) 100vw, 560px"
              unoptimized
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[120px]">{product.emoji}</span>
          )}
        </div>

        <div>
          {product.badge && (
            <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {product.badge}
            </span>
          )}
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
            {product.name}
          </h1>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-accent text-accent"
                      : "fill-muted-light text-muted-light"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">
              {product.rating}
            </span>
            <span className="text-sm text-muted">
              ({product.reviews} reviews)
            </span>
          </div>

          <p className="mb-6 text-sm leading-6 text-muted">
            {displayDescription}
          </p>

          <div className="mb-6 rounded-xl border border-primary/20 bg-primary-light/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">
              Availability Support
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Call or WhatsApp Jovel Pharmacy to confirm current stock, pickup,
              delivery, and pharmacist support before ordering.
            </p>
          </div>

          {product.dosage && (
            <div className="mb-6 rounded-xl bg-primary-light/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">
                Recommended Dosage
              </p>
              <p className="mt-1 text-sm text-foreground">{product.dosage}</p>
            </div>
          )}

          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-foreground/60 hover:text-foreground disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-foreground/60 hover:text-foreground disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                addItem(product, qty);
                toast(`${qty > 1 ? `${qty}x ` : ""}${product.name} added to list`);
                setQty(1);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add to List
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Truck className="h-4 w-4" />, label: "Delivery Available" },
              { icon: <ShieldCheck className="h-4 w-4" />, label: "Genuine Product" },
              { icon: <RotateCcw className="h-4 w-4" />, label: "Easy Returns" },
            ].map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center gap-1 rounded-xl bg-muted-light p-3 text-center"
              >
                <span className="text-primary">{p.icon}</span>
                <span className="text-[11px] font-medium text-muted">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="reviews">
        <ProductReviews productId={product.id} />
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
            You May Also Like
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
