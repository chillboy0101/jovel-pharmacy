"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MessageCircle, Phone } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import PriceSlider from "@/components/PriceSlider";
import PageLoader from "@/components/PageLoader";

type SortKey = "default" | "price-asc" | "price-desc" | "rating" | "name" | "sale" | "bestseller" | "new";

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
  const initialBadge = searchParams.get("badge") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [badge, setBadge] = useState(initialBadge);
  const [sort, setSort] = useState<SortKey>("default");
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [globalMaxPrice, setGlobalMaxPrice] = useState(5000);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: 0, max: 5000 });
  const pageSize = 12;

  const filterKey = `${badge}|${selectedCat}|${search.trim()}|${sort}|${appliedPriceRange.min}-${appliedPriceRange.max}`;

  const pageMemoryKey = useMemo(() => `shop:lastPage:${filterKey}`, [filterKey]);

  useEffect(() => {
    const q = searchParams.get("search") || "";
    const c = searchParams.get("cat") || "all";
    const b = searchParams.get("badge") || "";
    const s = searchParams.get("sort") as SortKey || "default";
    
    queueMicrotask(() => {
      setSearchInput(q);
      setSearch(q);
      setSelectedCat(c);
      setBadge(b);
      
      // Sync sort with badge if badge is present and sort is default
      if (b === "sale" && s === "default") {
        setSort("sale");
      } else if (b === "bestseller" && s === "default") {
        setSort("bestseller");
      } else if (b === "new" && s === "default") {
        setSort("new");
      } else {
        setSort(s);
      }
    });
  }, [searchParams]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
    ]).then(([cats]) => {
      setCategories(Array.isArray(cats) ? cats : []);
    }).catch(() => {});
  }, []);

  async function fetchPage(nextPage: number) {
    const productsUrl = new URL("/api/products", window.location.origin);
    if (badge) productsUrl.searchParams.set("badge", badge);
    if (selectedCat !== "all") productsUrl.searchParams.set("cat", selectedCat);
    if (search.trim()) productsUrl.searchParams.set("search", search.trim());
    if (sort !== "default") productsUrl.searchParams.set("sort", sort);
    if (appliedPriceRange.min > 0) productsUrl.searchParams.set("minPrice", String(appliedPriceRange.min));
    if (appliedPriceRange.max < globalMaxPrice) productsUrl.searchParams.set("maxPrice", String(appliedPriceRange.max));
    productsUrl.searchParams.set("page", String(nextPage));
    productsUrl.searchParams.set("pageSize", String(pageSize));

    const res = await fetch(productsUrl.toString());
    const prods = res.ok ? await res.json() : [];
    const arr = Array.isArray(prods) ? (prods as Product[]) : [];

    const hTotalPages = res.headers.get("X-Total-Pages");
    const hTotalCount = res.headers.get("X-Total-Count");
    const hGlobalMax = res.headers.get("X-Max-Price");
    const parsedTotalPages = hTotalPages ? parseInt(hTotalPages, 10) : 1;
    const parsedTotalCount = hTotalCount ? parseInt(hTotalCount, 10) : 0;
    const parsedGlobalMax = hGlobalMax ? parseInt(hGlobalMax, 10) : 5000;

    setProducts(arr);
    setTotalPages(Number.isFinite(parsedTotalPages) && parsedTotalPages > 0 ? parsedTotalPages : 1);
    setTotalCount(Number.isFinite(parsedTotalCount) && parsedTotalCount >= 0 ? parsedTotalCount : 0);
    setGlobalMaxPrice(parsedGlobalMax);
    
    // Only update slider range if it's the initial load or "all" category with no price filter
    if (appliedPriceRange.min === 0 && appliedPriceRange.max === 5000) {
      setPriceRange({ min: 0, max: parsedGlobalMax });
      setAppliedPriceRange({ min: 0, max: parsedGlobalMax });
    }
  }

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(pageMemoryKey) : null;
    const remembered = raw ? parseInt(raw, 10) : 1;
    const safeRemembered = Number.isFinite(remembered) && remembered > 0 ? remembered : 1;
    if (page !== safeRemembered) setPage(safeRemembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageMemoryKey]);

  useEffect(() => {
    setLoading(true);
    fetchPage(page)
      .then(() => {
        setLoading(false);
        setInitialLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setInitialLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageMemoryKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(pageMemoryKey, String(page));
  }, [page, pageMemoryKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const filtered = useMemo(() => products, [products]);

  const pagination = useMemo(() => {
    const last = totalPages;
    const current = page;
    if (last <= 1) return [] as Array<number | "ellipsis">;

    const endSize = 1;
    const midSize = 2;

    const pages = new Set<number>();

    // Start edge
    for (let p = 1; p <= Math.min(endSize, last); p++) pages.add(p);
    // End edge
    for (let p = Math.max(1, last - endSize + 1); p <= last; p++) pages.add(p);
    // Middle around current
    for (let p = current - midSize; p <= current + midSize; p++) {
      if (p >= 1 && p <= last) pages.add(p);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const items: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = i > 0 ? sorted[i - 1] : null;
      if (prev !== null && p - prev > 1) items.push("ellipsis");
      items.push(p);
    }

    return items;
  }, [page, totalPages]);

  if (initialLoading) return <PageLoader text="Loading products…" />;

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
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-light p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Can’t find your medicine?</p>
              <p className="text-xs text-muted">Call us directly to check availability and place an order.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="tel:+233508396646"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call to Order
              </a>
              <a
                href="https://wa.me/233508396646"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Categories
                </h3>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCat("all");
                    setBadge("");
                    setSort("default");
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedCat === "all" && !badge
                      ? "bg-primary-light text-primary-dark"
                      : "text-foreground/70 hover:bg-muted-light"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCat(cat.id);
                      setBadge("");
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      selectedCat === cat.id && !badge
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
          {loading && (
            <div className="mb-4 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-muted">
              Loading…
            </div>
          )}
          {/* Sort bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted">
              {totalPages > 1 && (
                <span className="font-medium text-foreground">Page {page}</span>
              )}
              <span>
                Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalCount)} of {totalCount} results
              </span>
            </div>
            <select
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value as SortKey;
                setSort(newSort);
                // If the user manually changes the sort, clear the badge so we show all products sorted by the new criteria
                if (newSort !== "sale" && newSort !== "bestseller" && newSort !== "new") {
                  setBadge("");
                } else if (newSort === "sale") {
                  setBadge("sale");
                } else if (newSort === "bestseller") {
                  setBadge("bestseller");
                } else if (newSort === "new") {
                  setBadge("new");
                }
              }}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground outline-none"
            >
              <option value="default">Sort: Default</option>
              <option value="sale">Sort: On Sale</option>
              <option value="bestseller">Sort: Bestsellers</option>
              <option value="new">Sort: New Arrivals</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="mb-2 text-lg font-semibold text-foreground">
                No products found
              </p>
              <p className="text-sm text-muted mb-6">
                Try adjusting your search or filter — or call us directly to find what you need.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="tel:+233508396646"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call to Order
                </a>
                <a
                  href="https://wa.me/233508396646"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex items-center gap-2" aria-label="Pagination">
                    {pagination.map((item, idx) =>
                      item === "ellipsis" ? (
                        <span key={`e-${idx}`} className="px-2 text-sm text-muted">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          className={
                            item === page
                              ? "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                              : "rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted-light"
                          }
                          aria-current={item === page ? "page" : undefined}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
