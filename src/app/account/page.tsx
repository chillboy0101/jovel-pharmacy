"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole } from "@/lib/auth";

type OrderItem = {
  quantity: number;
  price: number;
  product: { name: string; emoji: string; imageUrl?: string | null };
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
};

export default function AccountPage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated && user?.role && isAdminRole(user.role)) {
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    const res = await login(email, password);
    const ok = res.ok;
    const error = res.error || "";
    if (!ok) {
      if (error === "EMAIL_NOT_VERIFIED") {
        setAuthError("Please verify your email address before signing in. Check your inbox for a verification code.");
      } else {
        setAuthError("Invalid email or password.");
      }
    }
    setLoading(false);
  };

  // Authenticated view
  if (isAuthenticated && user) {
    if (!isAdminRole(user.role)) {
      return (
        <div className="mx-auto flex max-w-md flex-col px-6 py-20">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
            <p className="mt-1 text-sm text-muted">
              This login is for Jovel staff only.
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:border-red-300 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">Staff</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:border-red-300 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/admin"
            className="rounded-2xl border border-primary/30 bg-primary-light p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Go to Admin Panel</h3>
            <p className="text-xs text-muted">Manage products, orders & team</p>
          </Link>
        </div>
      </div>
    );
  }

  // Auth form
  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Staff Login
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to access the admin panel.
        </p>
      </div>

      {authError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600 font-medium">
          {authError}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Please wait…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
