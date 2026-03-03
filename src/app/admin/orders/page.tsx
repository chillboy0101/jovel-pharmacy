"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Phone, MapPin, Mail, Package } from "lucide-react";

type Order = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  total: number;
  shipping: number;
  status: string;
  createdAt: string;
  items: Array<{
    quantity: number;
    price: number;
    product: { name: string; emoji: string };
  }>;
  user: { name: string; email: string } | null;
};

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

type Tab = "active" | "history";
const activeStatuses = ["pending", "processing", "shipped"];
const historyStatuses = ["delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading orders…
      </div>
    );
  }

  const filteredOrders = orders.filter((o) =>
    tab === "active" ? activeStatuses.includes(o.status) : historyStatuses.includes(o.status),
  );
  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
  const historyCount = orders.filter((o) => historyStatuses.includes(o.status)).length;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Orders ({orders.length})
      </h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-xl bg-muted-light p-1">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "active"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "history"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          History ({historyCount})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          {tab === "active" ? "No active orders." : "No completed or cancelled orders yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            return (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-white overflow-hidden"
            >
              {/* Header row — always visible */}
              <div
                className="flex cursor-pointer flex-wrap items-start justify-between gap-2 p-5 hover:bg-muted-light/40"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {order.firstName || order.user?.name || "Guest"} {order.lastName ?? ""}
                    </p>
                    <p className="text-xs text-muted">{order.email}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[order.status] ?? "bg-muted-light text-muted"}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-lg font-bold text-foreground">
                    ${order.total.toFixed(2)}
                  </p>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted" />
                    : <ChevronDown className="h-4 w-4 text-muted" />
                  }
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                  <div className="grid gap-6 md:grid-cols-2">

                    {/* Customer details */}
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Customer Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 shrink-0 text-muted" />
                          <a href={`mailto:${order.email}`} className="text-primary hover:underline">{order.email}</a>
                        </div>
                        {order.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`tel:${order.phone}`} className="text-foreground/80">{order.phone}</a>
                          </div>
                        )}
                        {order.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                            <span className="text-foreground/80">
                              {order.address}<br />
                              {[order.city, order.state, order.zip].filter(Boolean).join(", ")}
                              {order.country && <><br />{order.country}</>}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 rounded-lg bg-muted-light px-3 py-2 text-xs text-muted">
                          Order ID: <span className="font-mono font-medium text-foreground">{order.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order items + total */}
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Order Items</h3>
                      <div className="space-y-1.5 rounded-lg border border-border bg-white p-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-foreground/80">
                              {item.product.emoji} {item.product.name}
                              <span className="ml-1 text-xs text-muted">× {item.quantity}</span>
                            </span>
                            <span className="font-medium text-foreground">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="mt-2 border-t border-border pt-2 space-y-1">
                          {order.shipping > 0 && (
                            <div className="flex justify-between text-xs text-muted">
                              <span>Shipping</span>
                              <span>${order.shipping.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-foreground">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
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
