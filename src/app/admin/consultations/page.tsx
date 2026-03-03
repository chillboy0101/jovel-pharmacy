"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Video, Phone, MapPin, Mail, ChevronDown, ChevronUp } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type Consultation = {
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

const statusOptions = ["pending", "confirmed", "completed", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};
const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  instore: <MapPin className="h-4 w-4" />,
};

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/consultations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        const notes: Record<string, string> = {};
        arr.forEach((c: Consultation) => { notes[c.id] = c.adminNotes ?? ""; });
        setAdminNotes(notes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpdate(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/consultations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: adminNotes[id] ?? "" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    setUpdatingId(null);
  }

  if (loading) return <PageLoader text="Loading consultations…" />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Consultations ({items.length})</h1>
      <p className="mb-6 text-sm text-muted">Manage and respond to consultation bookings.</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No consultation bookings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-white">
                <div
                  className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-muted-light/40"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      {typeIcons[c.type] ?? <Calendar className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] md:text-xs text-muted truncate">
                        {c.type.charAt(0).toUpperCase() + c.type.slice(1)} · {c.duration} min · {c.date} at {c.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <select
                      value={c.status}
                      disabled={updatingId === c.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleUpdate(c.id, e.target.value); }}
                      className={`rounded-full border-0 px-3 py-1 text-[10px] md:text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[c.status] ?? "bg-muted-light text-muted"}`}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</p>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted shrink-0" />}
                    </div>
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
                            <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`tel:${c.phone}`} className="text-foreground/80">{c.phone}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-muted" />
                            <span className="text-foreground/80">{c.duration} min {c.type} consultation</span>
                          </div>
                          {c.notes && (
                            <div className="mt-2 rounded-lg bg-muted-light p-3 text-xs text-foreground/80">
                              <span className="font-semibold">Patient notes: </span>{c.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Admin Notes</h3>
                        <textarea
                          value={adminNotes[c.id] ?? ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Add notes, confirmation details, video link…"
                          rows={4}
                          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleUpdate(c.id, c.status)}
                          disabled={updatingId === c.id}
                          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                        >
                          {updatingId === c.id ? "Saving…" : "Save Notes"}
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
