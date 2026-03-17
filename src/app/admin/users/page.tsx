"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "STAFF" | "ADMIN">("USER");

  async function load() {
    setError("");
    const res = await fetch("/api/users", { cache: "no-store" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to load users");
    }
    const data = (await res.json()) as UserRow[];
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    setMessage("");
    try {
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setRefreshing(false);
    }
  }

  const adminCount = useMemo(() => users.filter((u) => u.role === "ADMIN").length, [users]);

  async function changeRole(userId: string, nextRole: "USER" | "STAFF" | "ADMIN") {
    setError("");
    setMessage("");
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to update role");
    }
    setMessage("Role updated.");
    await load();
  }

  async function editUser(userId: string, currentName: string | null) {
    const nextName = window.prompt("Update name (leave blank to clear):", currentName ?? "");
    if (nextName === null) return;

    const nextPassword = window.prompt("Set a new password (min 6). Leave blank to keep current:", "");
    if (nextPassword === null) return;

    setError("");
    setMessage("");

    const payload: { name?: string | null; password?: string } = {
      name: nextName.trim() ? nextName.trim() : null,
    };
    if (nextPassword.trim()) payload.password = nextPassword.trim();

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to update user");
    }

    setMessage("User updated.");
    await load();
  }

  async function deleteUser(userId: string, email: string) {
    const ok = window.confirm(`Delete user ${email}? This cannot be undone.`);
    if (!ok) return;

    setError("");
    setMessage("");
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to delete user");
    }

    setMessage("User deleted.");
    await load();
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
          role,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to create user");
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setShowCreate(false);
      setMessage("User created.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <PageLoader text="Loading users…" />;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted">Manage all users (customers, staff, and admins).</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted-light disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {showCreate && (
        <form onSubmit={createUser} className="mb-6 rounded-xl border border-primary/20 bg-primary-light/20 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground">Create user account</h2>
            <div className="inline-flex items-center gap-2 text-xs text-muted">
              <Shield className="h-4 w-4" />
              Admin only
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              required
              placeholder="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              required
              placeholder="Password (min 6) *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <select
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ADMIN" || v === "STAFF" || v === "USER") setRole(v);
              }}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="USER">Role: User</option>
              <option value="STAFF">Role: Staff</option>
              <option value="ADMIN">Role: Admin</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="text-sm font-semibold text-foreground">All users</div>
          <div className="text-xs text-muted">
            {users.length} total
            {" · "}
            {adminCount} admin
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted-light/50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted-light/40">
                  <td className="px-5 py-3 text-foreground">{u.name || "—"}</td>
                  <td className="px-5 py-3 text-foreground/80">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role === "ADMIN" ? "ADMIN" : u.role === "STAFF" ? "STAFF" : "USER"}
                      onChange={(e) =>
                        changeRole(
                          u.id,
                          e.target.value === "ADMIN" ? "ADMIN" : e.target.value === "STAFF" ? "STAFF" : "USER",
                        ).catch((e: unknown) =>
                          setError(e instanceof Error ? e.message : "Failed to update role"),
                        )
                      }
                      className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    >
                      <option value="USER">USER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editUser(u.id, u.name).catch((e: unknown) =>
                            setError(e instanceof Error ? e.message : "Failed to update user"),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted-light"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteUser(u.id, u.email).catch((e: unknown) =>
                            setError(e instanceof Error ? e.message : "Failed to delete user"),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
