"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, PackagePlus, Download } from "lucide-react";
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
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted-light"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

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
