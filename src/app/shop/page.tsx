"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import PageLoader from "@/components/PageLoader";

type SortKey = "default" | "price-asc" | "price-desc" | "rating" | "name";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted">Loading…</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortKey>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.ok ? r.json() : []),
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCat !== "all") {
      list = list.filter((p) => p.categoryId === selectedCat);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [products, selectedCat, search, sort]);

  if (loading) return <PageLoader text="Loading products…" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
          Shop
        </h1>
        <p className="text-muted">
          Browse our full range of premium health and wellness products.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="sticky top-24 space-y-6">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl bg-muted-light px-3 py-2.5">
              <Search className="h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCat("all")}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedCat === "all"
                      ? "bg-primary-light text-primary-dark"
                      : "text-foreground/70 hover:bg-muted-light"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      selectedCat === cat.id
                        ? "bg-primary-light text-primary-dark"
                        : "text-foreground/70 hover:bg-muted-light"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">
              {filtered.length} product{filtered.length !== 1 && "s"}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground outline-none"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="mb-2 text-lg font-semibold text-foreground">
                No products found
              </p>
              <p className="text-sm text-muted">
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
