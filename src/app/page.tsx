"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Award,
  Star,
  Sparkles,
  ShieldPlus,
  Activity,
  Droplet,
  Heart,
  Stethoscope,
} from "lucide-react";
import { testimonials } from "@/data/testimonials";
import ProductCard from "@/components/ProductCard";
import PageLoader from "@/components/PageLoader";
import type { Product, Category } from "@/lib/types";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-6 w-6" />,
  ShieldPlus: <ShieldPlus className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
  Droplet: <Droplet className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  Stethoscope: <Stethoscope className="h-6 w-6" />,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
      fetch("/api/products?badge=bestseller&limit=4").then((r) => r.ok ? r.json() : []),
      fetch("/api/products?badge=sale&limit=4").then((r) => r.ok ? r.json() : []),
    ]).then(([cats, featured, sale]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setFeaturedProducts(Array.isArray(featured) ? featured.filter((p: Product) => p.stock > 0).slice(0, 4) : []);
      setSaleProducts(Array.isArray(sale) ? sale.filter((p: Product) => p.stock > 0).slice(0, 4) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  return (
    <>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center md:py-32 lg:py-40">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Licensed & Certified Pharmacy
          </span>
          <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl animate-fade-in-up">
            Your Community Pharmacy Where{" "}
            <span className="underline decoration-accent/60 decoration-4 underline-offset-4">
              Service Counts
            </span>
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/80 animate-fade-in-up stagger-1">
            Premium medications, expert consultations, and same-day dispatch —
            all from a pharmacy that truly cares.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up stagger-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl active:scale-[0.98]"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/prescriptions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Transfer Prescription
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
          {[
            { icon: <Truck className="h-5 w-5" />, text: "Delivery Available" },
            { icon: <ShieldCheck className="h-5 w-5" />, text: "Licensed Pharmacists" },
            { icon: <Clock className="h-5 w-5" />, text: "Same-Day Dispatch" },
            { icon: <Award className="h-5 w-5" />, text: "100% Genuine Products" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                {b.icon}
              </div>
              <span className="text-sm font-medium text-foreground">
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-muted">
              Find exactly what you need — curated for your health and wellness.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?cat=${cat.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {iconMap[cat.icon]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-muted-light py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
                Bestsellers
              </h2>
              <p className="text-muted">
                Our most-loved products, trusted by thousands.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:flex"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="gradient-primary py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">
            Need a Prescription Refill?
          </h2>
          <p className="mb-6 max-w-lg text-white/80">
            Upload your prescription or transfer from another pharmacy — we&apos;ll
            handle the rest and deliver to your door.
          </p>
          <div className="flex gap-3">
            <Link
              href="/prescriptions"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-white/90"
            >
              Upload Prescription
            </Link>
            <Link
              href="/consult"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* On Sale */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
                On Sale
              </h2>
              <p className="text-muted">
                Premium quality at unbeatable prices.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:flex"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted-light py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              What Our Customers Say
            </h2>
            <p className="text-muted">Real reviews from real people.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-accent text-accent"
                    />
                  ))}
                </div>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-foreground/80">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Ready to Experience Better Care?
          </h2>
          <p className="mb-8 text-muted">
            Join thousands of happy customers who trust Jovel Pharmacy for their
            health and wellness needs.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/consult"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted-light"
            >
              Talk to a Pharmacist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
