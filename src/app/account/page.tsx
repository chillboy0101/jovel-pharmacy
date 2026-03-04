"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type OrderItem = {
  quantity: number;
  price: number;
  product: { name: string; emoji: string };
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const ordersRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/orders/mine")
        .then((r) => (r.ok ? r.json() : []))
        .then(setOrders);
    }
  }, [isAuthenticated]);

  // No longer redirecting admin users to admin panel after login
  // This allows them to view their personal account page/settings
  /*
  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    let ok: boolean;
    if (mode === "login") {
      ok = await login(email, password);
    } else {
      ok = await signup(name, email, password);
    }
    if (!ok) {
      setAuthError(mode === "login" ? "Invalid email or password." : "Sign-up failed. Email may already be in use.");
    }
    setLoading(false);
  };

  // Authenticated view
  if (isAuthenticated && user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted">{user.email}</p>
            {user.role === "ADMIN" && (
              <span className="mt-1 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">Admin</span>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:border-red-300 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order History card — scrolls to section below */}
          <button
            onClick={() => ordersRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-2xl border border-border bg-white p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Order History</h3>
            <p className="text-xs text-muted">Track and review past orders</p>
            {orders.length > 0 && (
              <span className="mt-2 inline-block rounded-full bg-muted-light px-2 py-0.5 text-[10px] font-semibold text-muted">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            )}
          </button>

          {/* Prescriptions card — links to /prescriptions */}
          <Link
            href="/prescriptions"
            className="rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">My Prescriptions</h3>
            <p className="text-xs text-muted">Upload or transfer prescriptions</p>
          </Link>

          {/* Settings card — links to shop/account area */}
          <Link
            href="/contact"
            className="rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Account Settings</h3>
            <p className="text-xs text-muted">Update profile and preferences</p>
          </Link>

          {/* Admin panel card — only for admins */}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-2xl border border-primary/30 bg-primary-light p-6 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Admin Panel</h3>
              <p className="text-xs text-muted">Manage products, orders & team</p>
            </Link>
          )}
        </div>

        {/* Real order history */}
        <section ref={ordersRef} className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Order History
          </h2>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-white py-10 text-center text-sm text-muted">
              No orders yet. <a href="/shop" className="font-medium text-primary hover:underline">Start shopping →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-xl border border-border bg-white"
                >
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted-light/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        #{order.id.slice(0, 12).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          GH₵{order.total.toFixed(2)}
                        </p>
                        <span className={`text-xs font-medium capitalize ${
                          order.status === "delivered" ? "text-green-600" :
                          order.status === "shipped" ? "text-blue-600" :
                          "text-primary"
                        }`}>
                          {order.status === "shipped" ? "On Route" : order.status}
                        </span>
                      </div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="rounded-lg border border-border p-1.5 hover:bg-primary-light hover:text-primary transition-colors"
                        title="Track Order"
                      >
                        <Package className="h-4 w-4" />
                      </Link>
                      {expandedOrder === order.id
                        ? <ChevronUp className="h-4 w-4 text-muted cursor-pointer" onClick={() => setExpandedOrder(null)} />
                        : <ChevronDown className="h-4 w-4 text-muted cursor-pointer" onClick={() => setExpandedOrder(order.id)} />
                      }
                    </div>
                  </button>
                  {expandedOrder === order.id && (
                    <div className="border-t border-border bg-muted-light/40 px-5 py-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-foreground/80">
                            {item.product.emoji} {item.product.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-foreground">
                            GH₵{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
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
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "login"
            ? "Sign in to manage orders and prescriptions."
            : "Join Jovel Pharmacy for a personalised experience."}
        </p>
      </div>

      {authError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {authError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
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
          placeholder="Email address"
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
        {mode === "login" && (
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-semibold text-primary hover:underline"
        >
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
