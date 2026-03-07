"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Video, Phone, MapPin, Mail, ChevronDown, ChevronUp, Search } from "lucide-react";
import PageLoader from "@/components/PageLoader";

const MEETING_LINK_PREFIX = "MEETING_LINK:";

function getMeetingLink(notes: string | null | undefined) {
  if (!notes) return "";
  const line = notes
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toUpperCase().startsWith(MEETING_LINK_PREFIX));
  if (!line) return "";
  return line.slice(MEETING_LINK_PREFIX.length).trim();
}

function setMeetingLink(existingNotes: string | null | undefined, link: string) {
  const normalized = (existingNotes ?? "").split("\n");
  const without = normalized.filter(
    (l) => !l.trim().toUpperCase().startsWith(MEETING_LINK_PREFIX),
  );
  const trimmedLink = link.trim();
  if (!trimmedLink) return without.join("\n").trim() || "";
  return [`${MEETING_LINK_PREFIX} ${trimmedLink}`, ...without].join("\n").trim();
}

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
  videoRoomId?: string | null;
  clientJoinToken?: string | null;
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
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
  const [videoLinks, setVideoLinks] = useState<Record<string, string>>({});
  const [enablingId, setEnablingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadConsultations(firstLoad = false) {
    if (!firstLoad) setRefreshing(true);
    try {
      const r = await fetch("/api/consultations");
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);

      const notes: Record<string, string> = {};
      const links: Record<string, string> = {};
      const vlinks: Record<string, string> = {};
      arr.forEach((c: Consultation) => {
        notes[c.id] = c.adminNotes ?? "";
        links[c.id] = getMeetingLink(c.adminNotes);
        if (c.videoRoomId && c.clientJoinToken) {
          vlinks[c.id] = `/consult/video/${c.id}?token=${encodeURIComponent(c.clientJoinToken)}`;
        }
      });
      setAdminNotes(notes);
      setMeetingLinks(links);
      setVideoLinks(vlinks);
    } catch {
      // Keep last good data
    } finally {
      if (firstLoad) setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadConsultations(true);
    const interval = setInterval(() => {
      loadConsultations(false);
    }, 20000);
    return () => clearInterval(interval);
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

  const filteredItems = items
    .filter((c) => {
      const s = search.trim().toLowerCase();
      if (!s) return true;
      return (
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        c.type.toLowerCase().includes(s) ||
        c.status.toLowerCase().includes(s) ||
        (c.notes ?? "").toLowerCase().includes(s) ||
        (adminNotes[c.id] ?? "").toLowerCase().includes(s) ||
        c.date.toLowerCase().includes(s) ||
        c.time.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) return <PageLoader text="Loading consultations…" />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Consultations ({items.length})</h1>
          <p className="text-sm text-muted">Manage and respond to consultation bookings.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => loadConsultations(false)}
            disabled={refreshing}
            className="w-full sm:w-auto rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-foreground hover:bg-muted-light disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search consultations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No consultation bookings found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-white">
                <div
                  className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 hover:bg-muted-light/40"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      {typeIcons[c.type] ?? <Calendar className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                        <span className={`block sm:hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[c.status] ?? "bg-muted-light text-muted"}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] md:text-xs text-muted leading-tight">
                        <span className="font-semibold text-primary/80 uppercase tracking-tight">{c.type}</span> · {c.duration}m · {c.date} @ {c.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
                    <div className="hidden sm:block">
                      <select
                        value={c.status}
                        disabled={updatingId === c.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); handleUpdate(c.id, e.target.value); }}
                        className={`rounded-full border-0 px-3 py-1 text-[10px] md:text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[c.status] ?? "bg-muted-light text-muted"}`}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-medium text-muted">Booked</p>
                        <p className="text-[10px] font-bold text-foreground whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted shrink-0" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted-light/10 px-4 pb-5 pt-4 sm:px-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="block sm:hidden">
                          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Update Status</h3>
                          <select
                            value={c.status}
                            disabled={updatingId === c.id}
                            onChange={(e) => handleUpdate(c.id, e.target.value)}
                            className={`w-full rounded-xl border-0 px-4 py-2.5 text-sm font-bold capitalize outline-none shadow-sm ${statusColors[c.status] ?? "bg-muted-light text-muted"}`}
                          >
                            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div>
                          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">Patient Details</h3>
                          <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm border border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted-light text-muted">
                                <Mail className="h-4 w-4 shrink-0" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-muted uppercase">Email</p>
                                <a href={`mailto:${c.email}`} className="block text-sm font-bold text-primary hover:underline truncate">{c.email}</a>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted-light text-muted">
                                <Phone className="h-4 w-4 shrink-0" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-muted uppercase">Phone</p>
                                <a href={`tel:${c.phone}`} className="block text-sm font-bold text-foreground truncate">{c.phone}</a>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted-light text-muted">
                                <Clock className="h-4 w-4 shrink-0" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-muted uppercase">Schedule</p>
                                <span className="block text-sm font-bold text-foreground leading-tight">{c.duration} min {c.type} session</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {c.notes && (
                          <div>
                            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Patient Notes</h3>
                            <div className="rounded-xl border border-border/50 bg-white p-4 text-xs italic text-foreground/80 shadow-sm leading-relaxed">
                              &quot;{c.notes}&quot;
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">Pharmacist Action</h3>
                        <div className="flex-1 space-y-3 rounded-xl bg-white p-4 shadow-sm border border-border/50">
                          {c.type === "video" && (
                            <div className="rounded-xl border border-border/60 bg-muted-light/30 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Meeting Link</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const link = (meetingLinks[c.id] ?? "").trim();
                                      if (!link) return;
                                      navigator.clipboard.writeText(link).catch(() => {});
                                    }}
                                    className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm border border-border/60 hover:bg-muted-light"
                                  >
                                    Copy
                                  </button>
                                  <a
                                    href={(meetingLinks[c.id] ?? "").trim() || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => {
                                      if (!(meetingLinks[c.id] ?? "").trim()) e.preventDefault();
                                    }}
                                    className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-primary-dark"
                                  >
                                    Open
                                  </a>
                                </div>
                              </div>
                              <input
                                value={meetingLinks[c.id] ?? ""}
                                onChange={(e) => {
                                  const link = e.target.value;
                                  setMeetingLinks((prev) => ({ ...prev, [c.id]: link }));
                                  setAdminNotes((prev) => ({
                                    ...prev,
                                    [c.id]: setMeetingLink(prev[c.id] ?? "", link),
                                  }));
                                }}
                                placeholder="Paste Google Meet / Zoom link here"
                                className="mt-2 w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                              <p className="mt-1 text-[10px] text-muted">
                                Share this link with the customer by email/phone.
                              </p>
                            </div>
                          )}

                          {c.type === "video" && (
                            <div className="rounded-xl border border-border/60 bg-white p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">In-App Video Call</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={enablingId === c.id}
                                    onClick={async () => {
                                      try {
                                        setEnablingId(c.id);
                                        const res = await fetch(`/api/consultations/${c.id}/video/enable`, { method: "POST" });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok) {
                                          alert(data.error || "Failed to enable video call");
                                          return;
                                        }

                                        const token = data.token as string;
                                        setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, clientJoinToken: token, videoRoomId: data.roomId } : x)));
                                        const url = `/consult/video/${c.id}?token=${encodeURIComponent(token)}`;
                                        setVideoLinks((prev) => ({ ...prev, [c.id]: url }));
                                        navigator.clipboard.writeText(`${window.location.origin}${url}`).catch(() => {});
                                      } finally {
                                        setEnablingId(null);
                                      }
                                    }}
                                    className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
                                  >
                                    {enablingId === c.id ? "Enabling…" : (videoLinks[c.id] ? "Re-generate" : "Enable")}
                                  </button>
                                  <a
                                    href={`/admin/consultations/${c.id}/video`}
                                    className="rounded-lg bg-muted-light px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm border border-border/60 hover:bg-muted-light/70"
                                  >
                                    Join
                                  </a>
                                </div>
                              </div>

                              {videoLinks[c.id] ? (
                                <div className="mt-2">
                                  <p className="text-[10px] font-medium text-muted uppercase">Client link</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <input
                                      readOnly
                                      value={`${typeof window !== "undefined" ? window.location.origin : ""}${videoLinks[c.id]}`}
                                      className="w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-xs outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const full = `${window.location.origin}${videoLinks[c.id]}`;
                                        navigator.clipboard.writeText(full).catch(() => {});
                                      }}
                                      className="rounded-lg bg-white px-2.5 py-2 text-[10px] font-bold text-foreground shadow-sm border border-border/60 hover:bg-muted-light"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <p className="mt-1 text-[10px] text-muted">
                                    Client can only join around the scheduled time.
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-2 text-[10px] text-muted">
                                  Click Enable to generate a secure join link for the customer.
                                </p>
                              )}
                            </div>
                          )}
                          <textarea
                            value={adminNotes[c.id] ?? ""}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder="Add confirmation details, video links, or private notes..."
                            rows={4}
                            className="w-full rounded-xl border border-border/60 bg-muted-light/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all resize-none"
                          />
                          <button
                            onClick={() => handleUpdate(c.id, c.status)}
                            disabled={updatingId === c.id}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {updatingId === c.id ? (
                              <>Saving...</>
                            ) : (
                              <>Save Consultation Notes</>
                            )}
                          </button>
                        </div>
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
