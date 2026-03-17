"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  User,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Clock,
  Settings,
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
  const { user, isAuthenticated, login, signup, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    // No auto-redirect to admin. Users can choose to go to admin if they are staff.
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsSignup(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");

    if (!isSignup) {
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
      return;
    }

    const res = await signup(name.trim(), email, phone, password, "EMAIL");
    if (!res.ok) {
      setAuthError(res.error || "Sign-up failed");
      setLoading(false);
      return;
    }

    const loginRes = await login(email, password);
    if (!loginRes.ok) {
      setSuccessMessage("Account created. Please sign in.");
      setIsSignup(false);
      setLoading(false);
      return;
    }

    setSuccessMessage("Account created!");
    setLoading(false);
  };

  // Authenticated view
  if (isAuthenticated && user) {
    const isAdmin = isAdminRole(user.role);

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted">{user.email}</p>
            {isAdmin && (
              <span className="mt-1 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                Admin Account
              </span>
            )}
          </div>
          <button
            onClick={logout}
            className="flex w-fit items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Order History Card */}
          <Link
            href="/account/orders"
            className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">My Orders</h3>
            <p className="mt-1 text-sm text-muted">View and track your previous purchases</p>
          </Link>

          {/* Profile Settings Card */}
          <Link
            href="/account/settings"
            className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Settings className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Profile Settings</h3>
            <p className="mt-1 text-sm text-muted">Update your personal information</p>
          </Link>

          {/* Admin Panel Card (Only for Staff) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="group rounded-2xl border border-primary/20 bg-primary-light/30 p-6 transition-all hover:border-primary/50 hover:bg-primary-light/50 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Admin Dashboard</h3>
              <p className="mt-1 text-sm text-muted">Access management tools and reports</p>
            </Link>
          )}
        </div>

        {/* Recent Orders Placeholder */}
        <div className="mt-12 rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted-light">
            <Clock className="h-6 w-6 text-muted" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No recent orders</h3>
          <p className="mt-1 text-sm text-muted">You haven't placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Start Shopping
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
          Welcome to Jovel
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup ? "Create an account to leave reviews." : "Sign in to your account to continue."}
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
        {isSignup && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        {isSignup && (
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        )}
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
          {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setAuthError("");
          setSuccessMessage("");
          setIsSignup((v) => !v);
        }}
        className="mt-4 text-center text-sm font-semibold text-primary hover:underline"
      >
        {isSignup ? "Already have an account? Sign in" : "No account? Quick sign up"}
      </button>
    </div>
  );
}
