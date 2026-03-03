"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, PackagePlus, Download, Upload, X, CheckCircle2 } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import PageLoader from "@/components/PageLoader";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [restocking, setRestocking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const headers = ["name","brand","categoryName","price","originalPrice","stock","description","dosage","badge","emoji"];
    const example = [
      "Vitamin C 1000mg","HealthPlus","Wellness & Vitamins","12.99","15.99","50",
      "High-potency vitamin C supplement","1 tablet daily","bestseller","💊",
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
    let ok = 0; let fail = 0;
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i].match(/(?:"([^"]*)"|([^,]*))(,|$)/g) ?? [];
      const vals = raw.map((v) => v.replace(/^"?|"?,?$|"$/g, "").trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
      const categoryId = categoryNameMap[row.categoryName?.toLowerCase()] ?? null;
      if (!row.name || !row.price || !categoryId) { fail++; continue; }
      const body = {
        name: row.name, brand: row.brand || "Unknown", categoryId,
        price: parseFloat(row.price), originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
        stock: parseInt(row.stock || "0", 10), description: row.description || row.name,
        dosage: row.dosage || undefined, badge: row.badge || undefined, emoji: row.emoji || "💊",
      };
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { ok++; } else { fail++; }
    }
    setImportResult({ ok, fail });
    setImporting(false);
    if (ok > 0) {
      const [prods] = await Promise.all([
        fetch("/api/products").then((r) => r.ok ? r.json() : []),
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
    }
  }

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

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  async function handleRestock(product: Product) {
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) return;
    setRestocking(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: product.stock + qty }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: product.stock + qty } : p,
        ),
      );
    }
    setRestockId(null);
    setRestockQty("10");
    setRestocking(false);
  }

  function exportCSV() {
    const headers = ["ID", "Name", "Brand", "Category", "Price", "Original Price", "Stock", "Badge", "Rating", "Reviews"];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${(categoryMap[p.categoryId] || p.categoryId).replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      p.originalPrice != null ? p.originalPrice.toFixed(2) : "",
      p.stock,
      p.badge || "",
      p.rating,
      p.reviews,
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  if (loading) return <PageLoader text="Loading products…" />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Products ({products.length})
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkImport(f); e.target.value = ""; }}
          />
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted-light"
            title="Download blank CSV template for bulk import"
          >
            <Download className="h-4 w-4" /> CSV Template
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-light px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white disabled:opacity-50"
            title="Import products from a CSV file"
          >
            <Download className="h-4 w-4" /> {importing ? "Importing…" : "Bulk Import"}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted-light"
          >
            <Upload className="h-4 w-4" /> Export CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
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
            {importResult.fail > 0 && ` · ${importResult.fail} row${importResult.fail !== 1 ? "s" : ""} skipped (missing name/price/category)`}
          </span>
          <button onClick={() => setImportResult(null)}><X className="h-4 w-4" /></button>
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
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-light text-left">
              <th className="px-4 py-3 font-semibold text-muted">Product</th>
              <th className="px-4 py-3 font-semibold text-muted">Category</th>
              <th className="px-4 py-3 font-semibold text-muted">Price</th>
              <th className="px-4 py-3 font-semibold text-muted">Stock</th>
              <th className="px-4 py-3 font-semibold text-muted">Badge</th>
              <th className="px-4 py-3 font-semibold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border last:border-0 hover:bg-muted-light/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{categoryMap[p.categoryId] || p.categoryId}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">
                    ${p.price.toFixed(2)}
                  </span>
                  {p.originalPrice && (
                    <span className="ml-1 text-xs text-muted line-through">
                      ${p.originalPrice.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                      p.stock === 0
                        ? "bg-red-100 text-red-600"
                        : p.stock <= 10
                          ? "bg-amber-100 text-amber-600"
                          : "bg-green-100 text-green-600"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.badge && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
                      {p.badge}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {restockId === p.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={restockQty}
                        onChange={(e) => setRestockQty(e.target.value)}
                        className="w-16 rounded-lg border border-border px-2 py-1 text-xs outline-none focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRestock(p)}
                        disabled={restocking}
                        className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        +Add
                      </button>
                      <button
                        onClick={() => setRestockId(null)}
                        className="rounded-lg px-2 py-1 text-xs text-muted hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setRestockId(p.id); setRestockQty("10"); }}
                        className="rounded-lg p-1.5 text-muted hover:bg-emerald-50 hover:text-emerald-600"
                        title="Quick restock"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </button>
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
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}
