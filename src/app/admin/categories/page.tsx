"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type CategoryWithCount = {
  id: string;
  name: string;
  description: string;
  icon: string;
  _count: { products: number };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      id: fd.get("id") as string,
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      icon: fd.get("icon") as string,
    };

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const newCat = await res.json();
      setCategories((prev) => [
        ...prev,
        { ...newCat, _count: { products: 0 } },
      ]);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create category");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string, productCount: number) {
    if (productCount > 0) {
      alert(
        `Cannot delete "${name}" — it has ${productCount} products. Reassign or delete them first.`,
      );
      return;
    }
    if (!confirm(`Delete category "${name}"?`)) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-border bg-white p-5"
        >
          {error && (
            <div className="mb-3 text-sm text-red-500">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              name="id"
              required
              placeholder="ID (e.g. baby-care)"
              pattern="[a-z0-9-]+"
              className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="name"
              required
              placeholder="Display name"
              className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="description"
              required
              placeholder="Description"
              className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="icon"
              required
              placeholder="Lucide icon name"
              className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-light text-left">
              <th className="px-4 py-3 font-semibold text-muted">ID</th>
              <th className="px-4 py-3 font-semibold text-muted">Name</th>
              <th className="px-4 py-3 font-semibold text-muted">
                Description
              </th>
              <th className="px-4 py-3 font-semibold text-muted">Icon</th>
              <th className="px-4 py-3 font-semibold text-muted">Products</th>
              <th className="px-4 py-3 font-semibold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-muted-light/50"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {c.id}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-muted">{c.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {c.icon}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted-light px-2 py-0.5 text-xs font-bold text-muted">
                    {c._count.products}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      handleDelete(c.id, c.name, c._count.products)
                    }
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
