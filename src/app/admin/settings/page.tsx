"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";

type DeliveryZone = {
  id: string;
  label: string;
  region?: string;
  rate: number;
  enabled: boolean;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [momoMerchantId, setMomoMerchantId] = useState("");
  const [momoMerchantName, setMomoMerchantName] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesSaving, setZonesSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/momo").then((r) => (r.ok ? r.json() : { momoMerchantId: "", momoMerchantName: "" })),
      fetch("/api/settings/delivery-zones").then((r) => (r.ok ? r.json() : { zones: [] })),
    ])
      .then(([momo, dz]: [{ momoMerchantId?: string; momoMerchantName?: string }, { zones?: DeliveryZone[] }]) => {
        setMomoMerchantId(momo.momoMerchantId ?? "");
        setMomoMerchantName(momo.momoMerchantName ?? "");
        setZones(Array.isArray(dz.zones) ? dz.zones : []);
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

  async function saveZones() {
    setZonesSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings/delivery-zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones }),
    });

    if (res.ok) {
      setMessage({ ok: true, text: "✓ Delivery zones saved" });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data.error || "Save failed" });
    }

    setZonesSaving(false);
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

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-foreground">Delivery Zones</h2>
        <p className="mb-4 text-xs text-muted">
          Set delivery rates by location. Customers will select a zone at checkout.
        </p>

        <div className="space-y-3">
          {zones.map((z, idx) => (
            <div key={z.id || idx} className="grid gap-2 rounded-xl border border-border bg-muted-light/30 p-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">ID</label>
                <input
                  value={z.id}
                  onChange={(e) =>
                    setZones((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], id: e.target.value };
                      return next;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. accra"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">Label</label>
                <input
                  value={z.label}
                  onChange={(e) =>
                    setZones((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], label: e.target.value };
                      return next;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Accra"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">Region</label>
                <input
                  value={z.region ?? ""}
                  onChange={(e) =>
                    setZones((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], region: e.target.value };
                      return next;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Greater Accra"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-muted mb-1">Rate (GH₵)</label>
                <input
                  value={String(z.rate)}
                  onChange={(e) =>
                    setZones((prev) => {
                      const next = [...prev];
                      const n = Number(e.target.value);
                      next[idx] = { ...next[idx], rate: Number.isFinite(n) ? n : 0 };
                      return next;
                    })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  inputMode="decimal"
                  placeholder="15"
                />
              </div>

              <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={z.enabled}
                    onChange={(e) =>
                      setZones((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], enabled: e.target.checked };
                        return next;
                      })
                    }
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => setZones((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setZones((prev) => [
                ...prev,
                { id: "", label: "", region: "", rate: 0, enabled: true },
              ])
            }
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted-light"
          >
            Add zone
          </button>
          <button
            type="button"
            onClick={saveZones}
            disabled={zonesSaving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {zonesSaving ? "Saving…" : "Save delivery zones"}
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
  );
}
