"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [momoMerchantId, setMomoMerchantId] = useState("");
  const [momoMerchantName, setMomoMerchantName] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/momo")
      .then((r) => (r.ok ? r.json() : { momoMerchantId: "", momoMerchantName: "" }))
      .then((data: { momoMerchantId?: string; momoMerchantName?: string }) => {
        setMomoMerchantId(data.momoMerchantId ?? "");
        setMomoMerchantName(data.momoMerchantName ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings/momo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ momoMerchantId, momoMerchantName }),
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

  if (loading) return <PageLoader text="Loading settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Update payment and store configuration.</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-foreground">MoMo Merchant ID</h2>
        <p className="mb-4 text-xs text-muted">
          This ID is shown on checkout for customers to pay via Mobile Money.
        </p>

        <div className="grid gap-3 sm:max-w-md">
          <input
            value={momoMerchantName}
            onChange={(e) => setMomoMerchantName(e.target.value)}
            placeholder="Merchant name (e.g. Jovel Pharmacy)"
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={momoMerchantId}
            onChange={(e) => setMomoMerchantId(e.target.value)}
            placeholder="Enter MoMo Merchant ID"
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
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
