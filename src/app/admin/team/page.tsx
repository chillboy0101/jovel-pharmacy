"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Save, Upload, Plus, Trash2, UserPlus } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  imageUrl: string | null;
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<TeamMember>>>({});
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", avatar: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.ok ? r.json() : [])
      .then((data: TeamMember[]) => {
        if (!Array.isArray(data)) { setLoading(false); return; }
        setMembers(data);
        const initial: Record<string, Partial<TeamMember>> = {};
        data.forEach((m) => { initial[m.id] = { ...m }; });
        setEdits(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function update(id: string, field: keyof TeamMember, value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function uploadPhoto(id: string, file: File) {
    setUploadingId(id);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload?folder=team", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      update(id, "imageUrl", url);
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, imageUrl: url } : m));
      setMessage({ id, text: "Photo uploaded! Click Save to confirm.", ok: true });
    } else {
      setMessage({ id, text: "Upload failed.", ok: false });
    }
    setUploadingId(null);
  }

  async function save(id: string) {
    setSavingId(id);
    const body = edits[id];
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => m.id === id ? updated : m));
      setMessage({ id, text: "✓ Saved successfully!", ok: true });
    } else {
      setMessage({ id, text: "Save failed — please try again.", ok: false });
    }
    setSavingId(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the team?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      alert("Failed to delete member.");
    }
    setDeletingId(null);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const avatar = newMember.avatar.trim() ||
      newMember.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newMember, avatar }),
    });
    if (res.ok) {
      const created = await res.json();
      setMembers((prev) => [...prev, created]);
      setEdits((prev) => ({ ...prev, [created.id]: { ...created } }));
      setNewMember({ name: "", role: "", bio: "", avatar: "" });
      setShowAddForm(false);
    } else {
      alert("Failed to add member.");
    }
    setAdding(false);
  }

  if (loading) return <PageLoader text="Loading team…" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="text-sm text-muted">Manage team members, upload photos, update bios.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <UserPlus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <form
          onSubmit={addMember}
          className="mb-6 rounded-xl border border-primary/20 bg-primary-light/20 p-5"
        >
          <h2 className="mb-4 text-sm font-bold text-foreground">New Team Member</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name *"
              value={newMember.name}
              onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              required
              placeholder="Job title *"
              value={newMember.role}
              onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              required
              placeholder="Bio *"
              rows={2}
              value={newMember.bio}
              onChange={(e) => setNewMember((p) => ({ ...p, bio: e.target.value }))}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
            />
            <input
              placeholder="Initials (auto-generated if blank)"
              value={newMember.avatar}
              onChange={(e) => setNewMember((p) => ({ ...p, avatar: e.target.value }))}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {adding ? "Adding…" : "Add Member"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {members.map((m) => {
          const e = edits[m.id] ?? m;
          return (
            <div key={m.id} className="flex flex-col rounded-xl border border-border bg-white p-4 md:p-5">
              {/* Photo & Actions Header */}
              <div className="mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-primary-light">
                  {e.imageUrl ? (
                    <Image src={e.imageUrl} alt={m.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-light text-2xl font-bold text-primary">
                      {m.avatar}
                    </div>
                  )}
                </div>
                <div className="w-full flex-1 space-y-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted-light px-4 py-2.5 text-sm text-muted transition hover:border-primary/50 hover:bg-primary-light/10">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        if (f) uploadPhoto(m.id, f);
                      }}
                    />
                    {uploadingId === m.id ? (
                      <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Uploading…</span>
                    ) : (
                      <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Photo</span>
                    )}
                  </label>
                  {e.imageUrl && (
                    <button
                      type="button"
                      onClick={() => update(m.id, "imageUrl", "")}
                      className="w-full text-center text-xs text-red-500 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted ml-1">Full Name</label>
                  <input
                    value={e.name ?? ""}
                    onChange={(ev) => update(m.id, "name", ev.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted ml-1">Job Title</label>
                  <input
                    value={e.role ?? ""}
                    onChange={(ev) => update(m.id, "role", ev.target.value)}
                    placeholder="Job title"
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted ml-1">Biography</label>
                  <textarea
                    value={e.bio ?? ""}
                    onChange={(ev) => update(m.id, "bio", ev.target.value)}
                    placeholder="Bio"
                    rows={3}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
                {message?.id === m.id ? (
                  <span className={`text-xs font-medium ${message.ok ? "text-green-600" : "text-red-500"}`}>
                    {message.text}
                  </span>
                ) : <span className="hidden sm:inline" />}
                <div className="flex w-full sm:w-auto gap-2">
                  <button
                    onClick={() => deleteMember(m.id, m.name)}
                    disabled={deletingId === m.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-muted hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === m.id ? "…" : "Remove"}
                  </button>
                  <button
                    onClick={() => save(m.id)}
                    disabled={savingId === m.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingId === m.id ? "…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
