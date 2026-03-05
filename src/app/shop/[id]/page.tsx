"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, ArrowLeft, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product, Category } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import PageLoader from "@/components/PageLoader";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
      fetch("/api/products").then((r) => r.ok ? r.json() : []),
    ]).then(([prod, cats, allProducts]) => {
      setProduct(prod);
      setCategories(Array.isArray(cats) ? cats : []);
      if (prod) {
        setRelated(
          (Array.isArray(allProducts) ? allProducts : [])
            .filter((p: Product) => p.categoryId === prod.categoryId && p.id !== prod.id)
            .slice(0, 4),
        );
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader text="Loading product…" />;

  if (!product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        <p className="mb-4 text-xl font-semibold">Product not found</p>
        <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Breadcrumb */}
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
        {/* Image */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-muted-light p-16">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-8"
            />
          ) : (
            <span className="text-[120px]">{product.emoji}</span>
          )}
        </div>

        {/* Details */}
        <div>
          {product.badge && (
            <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {product.badge}
            </span>
          )}
          <p className="mb-1 text-sm font-medium uppercase tracking-wider text-muted">
            {product.brand}
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
            {product.name}
          </h1>

          {/* Rating */}
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

          {/* Price */}
          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              GH₵{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted line-through">
                GH₵{product.originalPrice.toFixed(2)}
              </span>
            )}
            {product.originalPrice && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark">
                Save GH₵{(product.originalPrice - product.price).toFixed(2)}
              </span>
            )}
          </div>

          <p className="mb-6 leading-relaxed text-foreground/80">
            {product.description}
          </p>

          {product.dosage && (
            <div className="mb-6 rounded-xl bg-primary-light/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">
                Recommended Dosage
              </p>
              <p className="mt-1 text-sm text-foreground">{product.dosage}</p>
            </div>
          )}

          {/* Stock status */}
          {product.stock === 0 ? (
            <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Out of stock — check back soon.
            </div>
          ) : product.stock <= 5 ? (
            <p className="mb-4 text-sm font-semibold text-amber-600">
              Only {product.stock} left in stock!
            </p>
          ) : null}

          {/* Qty + Add */}
          <div className="mb-6 flex items-center gap-4">
            <div className={`flex items-center rounded-xl border border-border ${product.stock === 0 ? "opacity-40" : ""}`}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={product.stock === 0}
                className="px-3 py-2 text-foreground/60 hover:text-foreground disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={product.stock === 0 || qty >= product.stock}
                className="px-3 py-2 text-foreground/60 hover:text-foreground disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                addItem(product, qty);
                toast(`${qty > 1 ? `${qty}x ` : ""}${product.name} added to cart`);
                setQty(1);
              }}
              disabled={product.stock === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>

          {/* Perks */}
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

      {/* Reviews */}
      <div id="reviews">
        <ProductReviews productId={product.id} />
      </div>

      {/* Related */}
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
