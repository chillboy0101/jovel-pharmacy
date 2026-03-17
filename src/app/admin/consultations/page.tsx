"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type ConsultationItem = {
  id: string;
  type: string;
  duration: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
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

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<ConsultationItem[] | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/consultations")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        setItems(Array.isArray(data) ? (data as ConsultationItem[]) : []);
      })
      .catch(() => {
        setError("Failed to load consultations.");
        setItems([]);
      });
  }, []);

  const desktopRows = useMemo(() => {
    if (!items) return null;
    return items.map((c) => (
      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted-light/50">
        <td className="px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
            <p className="truncate text-xs text-muted">{c.email}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(c.type)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(c.phone)}</td>
        <td className="px-4 py-3 text-sm text-muted">{Number.isFinite(c.duration) ? `${c.duration} min` : "—"}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(c.date)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(c.time)}</td>
        <td className="px-4 py-3 text-sm text-muted">{labelOrDash(c.status)}</td>
        <td className="px-4 py-3 text-sm text-muted">{formatDateTime(c.createdAt)}</td>
      </tr>
    ));
  }, [items]);

  const mobileCards = useMemo(() => {
    if (!items) return null;
    return items.map((c) => (
      <div key={c.id} className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
            <p className="text-xs text-muted truncate">{c.phone} · {c.email}</p>
            <p className="mt-1 text-xs text-muted">
              {labelOrDash(c.type)} · {Number.isFinite(c.duration) ? `${c.duration} min` : "—"} · {labelOrDash(c.status)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {labelOrDash(c.date)} @ {labelOrDash(c.time)}
            </p>
          </div>
        </div>

        {c.notes && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">Notes</p>
            <p className="whitespace-pre-wrap text-xs text-muted break-words">{c.notes}</p>
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted">Created: {formatDateTime(c.createdAt)}</p>
      </div>
    ));
  }, [items]);

  if (!items) return <PageLoader text="Loading consultations…" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
          <p className="mt-1 text-sm text-muted">Incoming consultation bookings</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4" /> {items.length}
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
              <th className="px-4 py-3 font-semibold text-muted">Duration</th>
              <th className="px-4 py-3 font-semibold text-muted">Date</th>
              <th className="px-4 py-3 font-semibold text-muted">Time</th>
              <th className="px-4 py-3 font-semibold text-muted">Status</th>
              <th className="px-4 py-3 font-semibold text-muted">Created</th>
            </tr>
          </thead>
          <tbody>{desktopRows}</tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 lg:hidden">{mobileCards}</div>

      {items.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No consultation bookings yet.
        </div>
      )}
    </div>
  );
}
