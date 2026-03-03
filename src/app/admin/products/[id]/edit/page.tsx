"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Product, Category } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import PageLoader from "@/components/PageLoader";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [emoji, setEmoji] = useState("💊");

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
    ]).then(([p, cats]) => {
      if (p) {
        setProduct(p);
        setImageUrl(p.imageUrl ?? "");
        setEmoji(p.emoji ?? "💊");
      }
      setCategories(Array.isArray(cats) ? cats : []);
    }).catch(() => {});
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      brand: fd.get("brand") as string,
      categoryId: fd.get("categoryId") as string,
      basePrice: parseFloat(fd.get("basePrice") as string),
      discountPercent: parseFloat(fd.get("discountPercent") as string) || 0,
      description: fd.get("description") as string,
      dosage: (fd.get("dosage") as string) || null,
      stock: parseInt(fd.get("stock") as string, 10),
      costPrice: parseFloat(fd.get("costPrice") as string) || 0,
      badge: (fd.get("badge") as string) || null,
      emoji: emoji || "💊",
      imageUrl: imageUrl || null,
    };

    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1200);
      return;
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update product");
      setSaving(false);
    }
  }

  if (!product) return <PageLoader text="Loading product…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Edit: {product.name}
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          ✕ {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          ✓ Changes saved! Redirecting…
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-border bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Name *
            </label>
            <input
              name="name"
              required
              defaultValue={product.name}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Brand *
            </label>
            <input
              name="brand"
              required
              defaultValue={product.brand}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Category *
            </label>
            <select
              name="categoryId"
              required
              defaultValue={product.categoryId}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Base Price ($) *
            </label>
            <input
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product.originalPrice || product.price}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Discount (%)
            </label>
            <input
              name="discountPercent"
              type="number"
              step="1"
              min="0"
              max="100"
              defaultValue={product.discountPercent ?? 0}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Cost Price ($) *
            </label>
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product.costPrice ?? 0}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Stock *
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product.stock}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Description *
          </label>
          <textarea
            name="description"
            required
            rows={3}
            defaultValue={product.description}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Dosage
            </label>
            <input
              name="dosage"
              defaultValue={product.dosage ?? ""}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Badge
            </label>
            <select
              name="badge"
              defaultValue={product.badge ?? ""}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">None</option>
              <option value="bestseller">Bestseller</option>
              <option value="new">New</option>
              <option value="sale">Sale</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Product Image <span className="font-normal text-muted">(upload a photo or pick an emoji placeholder below)</span>
          </label>
          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-2xl">{emoji}</span>
              <p className="text-xs text-muted">Current emoji — replaced automatically when you upload a photo</p>
            </div>
            <ImageUpload currentUrl={imageUrl} onUrlChange={setImageUrl} onEmojiChange={setEmoji} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
