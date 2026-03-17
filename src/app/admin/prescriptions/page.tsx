  "use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type PrescriptionItem = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  fileUrl: string | null;
  notes: string | null;
  currentPharmacy: string | null;
  currentPharmacyPhone: string | null;
  rxNumber: string | null;
  medications: string | null;
  dob: string | null;
  pickup: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function labelOrDash(value: string | null | undefined) {
  const v = (value ?? "").trim();
  return v ? v : "—";
}

export default function AdminPrescriptionsPage() {
  const [items, setItems] = useState<PrescriptionItem[] | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/prescriptions")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        setItems(Array.isArray(data) ? (data as PrescriptionItem[]) : []);
      })
      .catch(() => {
        setError("Failed to load prescriptions.");
        setItems([]);
      });
  }, []);

  const desktopRows = useMemo(() => {
    if (!items) return null;
    return items.map((p) => (
      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted-light/50">
        <td className="px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
            <p className="truncate text-xs text-muted">{p.email}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(p.type)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(p.phone)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(p.pickup)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(p.status)}</td>
        <td className="px-4 py-3 text-sm text-muted">{formatDateTime(p.createdAt)}</td>
        <td className="px-4 py-3 text-sm">
          {p.fileUrl ? (
            <a
              href={p.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted-light"
            >
              View <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </td>
      </tr>
    ));
  }, [items]);

  const mobileCards = useMemo(() => {
    if (!items) return null;
    return items.map((p) => (
      <div key={p.id} className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
            <p className="text-xs text-muted truncate">{p.phone} · {p.email}</p>
            <p className="mt-1 text-xs text-muted">
              {labelOrDash(p.type)} · {labelOrDash(p.pickup)} · {labelOrDash(p.status)}
            </p>
          </div>
          {p.fileUrl ? (
            <a
              href={p.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted-light"
            >
              File <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 border-t border-border pt-4">
          {(p.currentPharmacy || p.currentPharmacyPhone) && (
            <div>
              <p className="text-xs font-semibold text-foreground">Current Pharmacy</p>
              <p className="text-xs text-muted break-words">{labelOrDash(p.currentPharmacy)}</p>
              {p.currentPharmacyPhone && (
                <p className="text-xs text-muted break-words">{p.currentPharmacyPhone}</p>
              )}
            </div>
          )}

          {p.rxNumber && (
            <div>
              <p className="text-xs font-semibold text-foreground">Rx Number</p>
              <p className="text-xs text-muted break-words">{p.rxNumber}</p>
            </div>
          )}

          {p.dob && (
            <div>
              <p className="text-xs font-semibold text-foreground">DOB</p>
              <p className="text-xs text-muted break-words">{p.dob}</p>
            </div>
          )}

          {p.medications && (
            <div>
              <p className="text-xs font-semibold text-foreground">Medications</p>
              <p className="whitespace-pre-wrap text-xs text-muted break-words">{p.medications}</p>
            </div>
          )}

          {p.notes && (
            <div>
              <p className="text-xs font-semibold text-foreground">Notes</p>
              <p className="whitespace-pre-wrap text-xs text-muted break-words">{p.notes}</p>
            </div>
          )}

          <p className="text-[11px] text-muted">Created: {formatDateTime(p.createdAt)}</p>
        </div>
      </div>
    ));
  }, [items]);

  if (!items) return <PageLoader text="Loading prescriptions…" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="mt-1 text-sm text-muted">Incoming upload / transfer / refill requests</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4" /> {items.length}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted-light">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted">Customer</th>
              <th className="px-4 py-3 font-semibold text-muted">Type</th>
              <th className="px-4 py-3 font-semibold text-muted">Phone</th>
              <th className="px-4 py-3 font-semibold text-muted">Pickup</th>
              <th className="px-4 py-3 font-semibold text-muted">Status</th>
              <th className="px-4 py-3 font-semibold text-muted">Created</th>
              <th className="px-4 py-3 font-semibold text-muted">File</th>
            </tr>
          </thead>
          <tbody>{desktopRows}</tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 lg:hidden">{mobileCards}</div>

      {items.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No prescription requests yet.
        </div>
      )}
    </div>
  );
}
