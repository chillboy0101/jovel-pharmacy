"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Save, Upload } from "lucide-react";

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
  const [edits, setEdits] = useState<Record<string, Partial<TeamMember>>>({});
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data);
        const initial: Record<string, Partial<TeamMember>> = {};
        data.forEach((m: TeamMember) => { initial[m.id] = { ...m }; });
        setEdits(initial);
        setLoading(false);
      });
  }, []);

  function update(id: string, field: keyof TeamMember, value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function uploadPhoto(id: string, file: File) {
    setUploadingId(id);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      update(id, "imageUrl", url);
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, imageUrl: url } : m));
      setMessage({ id, text: "Photo uploaded! Click Save to confirm." });
    } else {
      setMessage({ id, text: "Upload failed." });
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
      setMessage({ id, text: "Saved!" });
    } else {
      setMessage({ id, text: "Save failed." });
    }
    setSavingId(null);
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted">Loading team…</div>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Team Members</h1>
      <p className="mb-6 text-sm text-muted">Upload photos and update team info here. Photos are stored in Vercel Blob.</p>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
        {members.map((m) => {
          const e = edits[m.id] ?? m;
          return (
            <div key={m.id} className="rounded-xl border border-border bg-white p-5">
              {/* Photo */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-primary-light">
                  {e.imageUrl ? (
                    <Image src={e.imageUrl} alt={m.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-light text-xl font-bold text-primary">
                      {m.avatar}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted-light px-4 py-2.5 text-sm text-muted transition hover:border-primary/50 hover:bg-primary-light/10">
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
                      className="mt-1.5 text-xs text-red-500 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-2">
                <input
                  value={e.name ?? ""}
                  onChange={(ev) => update(m.id, "name", ev.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={e.role ?? ""}
                  onChange={(ev) => update(m.id, "role", ev.target.value)}
                  placeholder="Job title"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={e.bio ?? ""}
                  onChange={(ev) => update(m.id, "bio", ev.target.value)}
                  placeholder="Bio"
                  rows={2}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                {message?.id === m.id ? (
                  <span className="text-xs font-medium text-primary">{message.text}</span>
                ) : <span />}
                <button
                  onClick={() => save(m.id)}
                  disabled={savingId === m.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingId === m.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
