"use client";

import { useEffect, useMemo, useState } from "react";
import PageLoader from "@/components/PageLoader";
import { Plus, Send, Trash2, RefreshCw } from "lucide-react";

type HealthTip = {
  id: string;
  title: string;
  contentHtml: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
};

export default function AdminHealthTipsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [message, setMessage] = useState<null | { ok: boolean; text: string }>(null);

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");

  const canCreate = useMemo(() => {
    return title.trim().length >= 3 && contentHtml.trim().length >= 20;
  }, [contentHtml, title]);

  async function fetchTips(firstLoad = false) {
    if (firstLoad) setLoading(true);
    try {
      const r = await fetch("/api/admin/health-tips");
      if (!r.ok) throw new Error("Failed");
      const data = (await r.json()) as { tips?: HealthTip[] };
      setTips(Array.isArray(data.tips) ? data.tips : []);
    } catch {
      // keep last good
    } finally {
      if (firstLoad) setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTips(true);
  }, []);

  async function createTip() {
    if (!canCreate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/health-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contentHtml }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; tip?: HealthTip };
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Create failed" });
      } else {
        setTips((prev) => (data.tip ? [data.tip, ...prev] : prev));
        setTitle("");
        setContentHtml("");
        setMessage({ ok: true, text: "✓ Tip created" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  }

  async function publishTip(id: string) {
    if (!confirm("Publish this health tip and email it to subscribers?") ) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/health-tips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; tip?: HealthTip };
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Publish failed" });
      } else if (data.tip) {
        setTips((prev) => prev.map((t) => (t.id === id ? data.tip! : t)));
        setMessage({ ok: true, text: "✓ Published" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  }

  async function deleteTip(id: string) {
    if (!confirm("Delete this tip?") ) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/health-tips?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ ok: false, text: data.error || "Delete failed" });
      } else {
        setTips((prev) => prev.filter((t) => t.id !== id));
        setMessage({ ok: true, text: "✓ Deleted" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  }

  if (loading) return <PageLoader text="Loading health tips..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Health Tips</h1>
          <p className="text-sm text-muted">Create pharmacy healthcare tips and send them to subscribers.</p>
        </div>

        <button
          type="button"
          onClick={() => void fetchTips(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted-light"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.ok
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-foreground">New Tip</h2>

        <div className="grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            placeholder="Tip content (HTML allowed). Example: <p>Drink water...</p>"
            rows={7}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void createTip()}
              disabled={!canCreate || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {saving ? "Saving…" : "Create"}
            </button>
            <p className="text-xs text-muted">Minimum 3 chars title, 20 chars content.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-foreground">Tips</h2>

        {tips.length === 0 ? (
          <p className="text-sm text-muted">No tips yet.</p>
        ) : (
          <div className="space-y-4">
            {tips.map((t) => (
              <div key={t.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      Status: <span className="font-semibold">{t.status}</span>
                      {t.publishedAt ? ` · Published ${new Date(t.publishedAt).toLocaleString()}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void publishTip(t.id)}
                      disabled={saving || t.status === "published"}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish & Email
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteTip(t.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div
                  className="prose prose-sm max-w-none mt-3"
                  dangerouslySetInnerHTML={{ __html: t.contentHtml }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
