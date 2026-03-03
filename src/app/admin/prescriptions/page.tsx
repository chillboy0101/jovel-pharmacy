"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, ArrowRightLeft, RefreshCw, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type Prescription = {
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

const statusOptions = ["pending", "processing", "ready", "completed"];
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  ready: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
};
const typeIcons: Record<string, React.ReactNode> = {
  upload: <Upload className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  refill: <RefreshCw className="h-4 w-4" />,
};

export default function AdminPrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/prescriptions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        const notes: Record<string, string> = {};
        arr.forEach((p: Prescription) => { notes[p.id] = p.adminNotes ?? ""; });
        setAdminNotes(notes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpdate(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: adminNotes[id] ?? "" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
    setUpdatingId(null);
  }

  if (loading) return <PageLoader text="Loading prescriptions…" />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Prescriptions ({items.length})</h1>
      <p className="mb-6 text-sm text-muted">Manage upload, transfer, and refill requests.</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No prescription requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-white">
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted-light/40"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      {typeIcons[p.type] ?? <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted capitalize">
                        {p.type} request · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={p.status}
                      disabled={updatingId === p.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleUpdate(p.id, e.target.value); }}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[p.status] ?? "bg-muted-light text-muted"}`}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Patient Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`mailto:${p.email}`} className="text-primary hover:underline">{p.email}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`tel:${p.phone}`} className="text-foreground/80">{p.phone}</a>
                          </div>
                          {p.currentPharmacy && (
                            <p className="text-xs text-muted">Transfer from: <span className="text-foreground">{p.currentPharmacy}</span></p>
                          )}
                          {p.rxNumber && (
                            <p className="text-xs text-muted">Rx #: <span className="font-mono text-foreground">{p.rxNumber}</span></p>
                          )}
                          {p.medications && (
                            <div className="mt-2 rounded-lg bg-muted-light p-3 text-xs text-foreground/80">
                              <span className="font-semibold">Medications: </span>{p.medications}
                            </div>
                          )}
                          {p.notes && (
                            <div className="mt-2 rounded-lg bg-muted-light p-3 text-xs text-foreground/80">
                              <span className="font-semibold">Notes: </span>{p.notes}
                            </div>
                          )}
                          {p.fileUrl && (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Prescription File
                            </a>
                          )}
                          {p.pickup && (
                            <p className="text-xs text-muted">Pickup: <span className="text-foreground">{p.pickup}</span></p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Admin Notes</h3>
                        <textarea
                          value={adminNotes[p.id] ?? ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Add processing notes, pickup time, instructions…"
                          rows={4}
                          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleUpdate(p.id, p.status)}
                          disabled={updatingId === p.id}
                          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                        >
                          {updatingId === p.id ? "Saving…" : "Save Notes"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
