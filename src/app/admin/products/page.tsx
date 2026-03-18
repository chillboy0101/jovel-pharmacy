"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2, Download, Upload, X, CheckCircle2 } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import PageLoader from "@/components/PageLoader";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedSearchRef = useRef<number | null>(null);
  const latestQueryRef = useRef<string>("");

  const PAGE_SIZE = 50;

  const openOriginal = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  function downloadTemplate() {
    const headers = ["name","brand","categoryName","stock","description","dosage","badge","emoji","imageUrl","costPrice","expiryDate"];
    const example = [
      "Vitamin C 1000mg","HealthPlus","Wellness & Vitamins","50",
      "High-potency vitamin C supplement","1 tablet daily","bestseller","💊",
      "","7.50","2027-12-31",
    ];
    const csv = [headers.join(","), example.map((v) => `"${v}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jovel-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkImport(file: File) {
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { setImporting(false); return; }
    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
    const categoryNameMap = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id]));
    let ok = 0;
    let fail = 0;

    const rows = [] as Array<Record<string, string>>;
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i].match(/(?:\"([^\"]*)\"|([^,]*))(,|$)/g) ?? [];
      const vals = raw.map((v) => v.replace(/^"?|"?,?$|"$/g, "").trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
      rows.push(row);
    }

    const concurrency = 5;
    let idx = 0;
    async function worker() {
      while (idx < rows.length) {
        const current = rows[idx++];
        const categoryId = categoryNameMap[current.categoryName?.toLowerCase()] ?? null;
        if (!current.name || !categoryId) { fail++; continue; }

        const imageUrl = current.imageUrl || undefined;
        const body = {
          name: current.name,
          brand: current.brand || "Unknown",
          categoryId,
          stock: parseInt(current.stock || "0", 10) || 0,
          description: current.description || current.name,
          badge: current.badge || undefined,
          emoji: current.emoji || "💊",
          imageUrl,
        };

        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) ok++;
          else fail++;
        } catch {
          fail++;
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()));
    setImportResult({ ok, fail });
    setImporting(false);
    if (ok > 0) {
      // Refresh list
      setProducts([]);
      setPage(1);
      setHasMore(true);
      setLoading(true);
    }
  }

  const fetchPage = useCallback(async (opts: { page: number; reset: boolean; q: string }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    params.set("all", "1");
    params.set("fields", "adminList");
    params.set("page", String(opts.page));
    params.set("pageSize", String(PAGE_SIZE));
    if (opts.q) params.set("search", opts.q);

    let res: Response;
    try {
      res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
    } catch (err) {
      if (err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "AbortError") {
        return;
      }
      throw err;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || `Failed to load (${res.status})`);
    }
    const data = await res.json();
    const items = Array.isArray(data) ? (data as Product[]) : [];

    const total = Number(res.headers.get("X-Total-Count"));
    const totalPages = Number(res.headers.get("X-Total-Pages"));
    const currentPage = Number(res.headers.get("X-Page"));
    if (Number.isFinite(total)) setTotalCount(total);

    setProducts((prev) => (opts.reset ? items : [...prev, ...items]));
    setHasMore(
      Number.isFinite(totalPages) && Number.isFinite(currentPage)
        ? currentPage < totalPages
        : items.length === PAGE_SIZE,
    );
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : [])
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Initial load / refresh (also used after bulk import)
    const q = latestQueryRef.current;
    setLoading(true);
    setError("");
    fetchPage({ page: 1, reset: true, q })
      .then(() => {
        setPage(1);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      });
  }, [fetchPage]);

  useEffect(() => {
    // Debounce server-side search
    if (debouncedSearchRef.current) window.clearTimeout(debouncedSearchRef.current);
    debouncedSearchRef.current = window.setTimeout(() => {
      const q = search.trim().toLowerCase();
      latestQueryRef.current = q;
      setProducts([]);
      setHasMore(true);
      setPage(1);
      setLoading(true);
      setError("");
      fetchPage({ page: 1, reset: true, q })
        .then(() => setLoading(false))
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        });
    }, 300);

    return () => {
      if (debouncedSearchRef.current) window.clearTimeout(debouncedSearchRef.current);
    };
  }, [fetchPage, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading || loadingMore || !hasMore) return;

        const nextPage = page + 1;
        setLoadingMore(true);
        fetchPage({ page: nextPage, reset: false, q: latestQueryRef.current })
          .then(() => setPage(nextPage))
          .catch((e: unknown) => {
            setError(e instanceof Error ? e.message : "Failed to load");
            setHasMore(false);
          })
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "600px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  async function exportCSV() {
    const params = new URLSearchParams();
    params.set("all", "1");
    params.set("export", "1");
    params.set("fields", "adminList");
    if (latestQueryRef.current) params.set("search", latestQueryRef.current);
    const res = await fetch(`/api/products?${params.toString()}`);
    const prods = res.ok ? await res.json() : [];
    const list = Array.isArray(prods) ? (prods as Product[]) : [];

    const headers = ["ID", "Name", "Brand", "Category", "Badge", "Emoji", "Image URL"];
    const rows = list.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${(categoryMap[p.categoryId] || p.categoryId).replace(/"/g, '""')}"`,
      p.badge || "",
      p.emoji,
      p.imageUrl || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const filtered = products;

  const desktopRows = useMemo(() => {
    return filtered.map((p) => (
      <tr
        key={p.id}
        className="border-b border-border last:border-0 hover:bg-muted-light/50"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted-light">
              {p.imageUrl ? (
                <button
                  type="button"
                  onClick={() => openOriginal(p.imageUrl as string)}
                  className="relative h-10 w-10 overflow-hidden rounded-lg"
                  aria-label={`Open image for ${p.name} in a new tab`}
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-contain p-1"
                    sizes="40px"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                </button>
              ) : (
                <span className="text-xl">{p.emoji}</span>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted">{p.brand}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-muted">
          {categoryMap[p.categoryId] || "Uncategorized"}
        </td>
        <td className="px-4 py-3">
          {p.badge && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
              {p.badge}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/products/${p.id}/edit`}
              className="rounded-lg p-1.5 text-muted hover:bg-muted-light hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(p.id, p.name)}
              className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    ));
  }, [categoryMap, filtered, handleDelete, openOriginal]);

  const mobileCards = useMemo(() => {
    return filtered.map((p) => (
      <div key={p.id} className="rounded-xl border border-border bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted-light">
              {p.imageUrl ? (
                <button
                  type="button"
                  onClick={() => openOriginal(p.imageUrl as string)}
                  className="relative h-16 w-16 overflow-hidden rounded-2xl"
                  aria-label={`Open image for ${p.name} in a new tab`}
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-contain p-2"
                    sizes="64px"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                </button>
              ) : (
                <span className="text-3xl">{p.emoji}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug text-foreground break-words">{p.name}</p>
              <p className="mt-0.5 text-xs text-muted break-words">{p.brand} · {categoryMap[p.categoryId] || p.categoryId}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {p.badge && (
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
                {p.badge}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 min-[420px]:justify-end">
            <Link
              href={`/admin/products/${p.id}/edit`}
              className="rounded-xl p-2 text-muted hover:bg-muted-light hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-5 w-5" />
            </Link>
            <button
              onClick={() => handleDelete(p.id, p.name)}
              className="rounded-xl p-2 text-muted hover:bg-red-50 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    ));
  }, [categoryMap, filtered, handleDelete, openOriginal]);

  if (loading) return <PageLoader text="Loading products…" />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Products ({totalCount ?? products.length})
        </h1>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
          <input
            ref={importRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkImport(f); e.target.value = ""; }}
          />
          <button
            onClick={downloadTemplate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted-light sm:w-auto"
            title="Download blank CSV template for bulk import"
          >
            <Download className="h-4 w-4" /> CSV Template
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-light px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white disabled:opacity-50 sm:w-auto"
            title="Import products from a CSV file"
          >
            <Download className="h-4 w-4" /> {importing ? "Importing…" : "Bulk Import"}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted-light sm:w-auto"
          >
            <Upload className="h-4 w-4" /> Export CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
          importResult.fail === 0
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {importResult.ok} product{importResult.ok !== 1 ? "s" : ""} imported successfully
            {importResult.fail > 0 && ` · ${importResult.fail} row${importResult.fail !== 1 ? "s" : ""} skipped (missing name/category)`}
          </span>
          <button onClick={() => setImportResult(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5">
        <Search className="h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {/* Table - Desktop only */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-light text-left">
              <th className="px-4 py-3 font-semibold text-muted">Product</th>
              <th className="px-4 py-3 font-semibold text-muted">Category</th>
              <th className="px-4 py-3 font-semibold text-muted">Badge</th>
              <th className="px-4 py-3 font-semibold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {desktopRows}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No products found.
        </div>
      )}

      {/* Card List - Mobile only */}
      <div className="lg:hidden space-y-4">
        {mobileCards}
      </div>

      <div ref={sentinelRef} className="h-12" />

      {loadingMore && (
        <div className="mt-3 text-center text-sm text-muted">Loading more…</div>
      )}
    </div>
  );
}
