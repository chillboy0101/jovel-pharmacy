"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storyTitle, setStoryTitle] = useState("");
  const [storyParagraph1, setStoryParagraph1] = useState("");
  const [storyParagraph2, setStoryParagraph2] = useState("");

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/about")
      .then((r) => (r.ok ? r.json() : { storyTitle: "", storyParagraph1: "", storyParagraph2: "" }))
      .then((data: { storyTitle?: string; storyParagraph1?: string; storyParagraph2?: string }) => {
        setStoryTitle(data.storyTitle ?? "");
        setStoryParagraph1(data.storyParagraph1 ?? "");
        setStoryParagraph2(data.storyParagraph2 ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/settings/about", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyTitle, storyParagraph1, storyParagraph2 }),
    });

    if (res.ok) {
      setMessage({ ok: true, text: "✓ Saved" });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data.error || "Save failed" });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) return <PageLoader text="Loading About settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">About Page</h1>
        <p className="text-sm text-muted">Edit the public About page content.</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-foreground">Our Story</h2>
        <p className="mb-4 text-xs text-muted">This content appears on the /about page.</p>

        <div className="grid gap-3">
          <input
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Section title (e.g. Our Story)"
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          <textarea
            value={storyParagraph1}
            onChange={(e) => setStoryParagraph1(e.target.value)}
            placeholder="Paragraph 1"
            rows={5}
            className="w-full resize-y rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          <textarea
            value={storyParagraph2}
            onChange={(e) => setStoryParagraph2(e.target.value)}
            placeholder="Paragraph 2"
            rows={5}
            className="w-full resize-y rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>

            {message && (
              <span
                className={`text-xs font-semibold ${message.ok ? "text-green-600" : "text-red-500"}`}
              >
                {message.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
