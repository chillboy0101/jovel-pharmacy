"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Clock, ChevronDown, ChevronUp, MessageSquare, Trash2, CheckCircle, Search } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  status: string;
  repliedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  read: "bg-blue-100 text-blue-700",
  replied: "bg-green-100 text-green-700",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    setLoading(true);
    fetch("/api/contact")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setMessages(arr);
        const notes: Record<string, string> = {};
        arr.forEach((m: ContactMessage) => { notes[m.id] = m.adminNotes ?? ""; });
        setAdminNotes(notes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  async function handleUpdate(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: adminNotes[id] ?? "" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    setUpdatingId(null);
  }

  async function handleReply(id: string) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    // Open email client
    window.location.href = `mailto:${message.email}?subject=Re: Jovel Pharmacy - ${message.topic || "Inquiry"}`;

    // Ask if it was sent before updating status
    setTimeout(async () => {
      const confirmed = confirm("Did you send the email? Click OK to mark as Replied.");
      if (confirmed) {
        setUpdatingId(id);
        const res = await fetch(`/api/contact/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replied: true }),
        });

        if (res.ok) {
          const updated = await res.json();
          setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
        }
        setUpdatingId(null);
      }
    }, 1000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  }

  const filteredMessages = messages.filter((m) => {
    const s = search.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(s) ||
      m.lastName.toLowerCase().includes(s) ||
      m.email.toLowerCase().includes(s) ||
      m.message.toLowerCase().includes(s) ||
      (m.topic ?? "").toLowerCase().includes(s)
    );
  });

  if (loading) return <PageLoader text="Loading messages..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages ({messages.length})</h1>
          <p className="text-sm text-muted">Manage inquiries from the contact form.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-sm text-muted shadow-sm">
          No messages found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((m) => {
            const isExpanded = expandedId === m.id;
            return (
              <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md">
                <div
                  className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-muted-light/30"
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted truncate">
                        {m.topic || "General Inquiry"} · {new Date(m.createdAt).toLocaleDateString()} at {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusColors[m.status] || "bg-muted-light text-muted"}`}>
                      {m.status}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted-light/10 px-5 pb-5 pt-4">
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Contact Info</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 shrink-0 text-muted" />
                              <a href={`mailto:${m.email}`} className="text-primary hover:underline truncate">{m.email}</a>
                            </div>
                            {m.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-muted" />
                                <a href={`tel:${m.phone}`} className="text-foreground/80">{m.phone}</a>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0 text-muted" />
                              <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Actions</h3>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={m.status}
                              onChange={(e) => handleUpdate(m.id, e.target.value)}
                              className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
                            >
                              <option value="pending">Pending</option>
                              <option value="read">Mark as Read</option>
                              <option value="replied">Mark as Replied</option>
                            </select>
                            <button 
                              onClick={() => handleDelete(m.id)}
                              className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Pharmacist Notes</h3>
                          <textarea
                            value={adminNotes[m.id] ?? ""}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Add internal notes..."
                            rows={3}
                            className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleUpdate(m.id, m.status)}
                            className="mt-2 text-[10px] font-bold text-primary hover:underline"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Message Content</h3>
                        <div className="rounded-xl border border-border bg-white p-4 text-sm text-foreground shadow-sm leading-relaxed whitespace-pre-wrap">
                          {m.message}
                        </div>
                        {m.repliedAt && (
                          <p className="mt-2 text-[10px] text-green-600 font-medium italic">
                            Last replied on {new Date(m.repliedAt).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleReply(m.id)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Reply via Email
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
