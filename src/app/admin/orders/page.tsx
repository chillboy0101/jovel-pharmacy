"use client";

import { Suspense, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Phone, MapPin, Mail, Package, Search, Trash2, ExternalLink } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { useSearchParams } from "next/navigation";

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
  createdAt: string;
  paymentReference: string | null;
  paymentTransactionId?: string | null;
  prescriptionId?: string | null;
  items: Array<{
    quantity: number;
    price: number;
    product: { name: string; emoji: string };
  }>;
  status: string;
  paymentStatus: string;
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

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleDelete(orderId: string) {
    const current = orders.find((o) => o.id === orderId);
    const canDelete =
      current?.paymentStatus === "unpaid" && (current.status === "pending" || current.status === "cancelled");
    if (!canDelete) {
      window.alert("This order cannot be deleted because it has been paid for or is already in fulfillment. Please cancel the order instead.");
      return;
    }

    const ok = window.confirm(
      "Delete this order permanently? This will restore product stock and remove the order.",
    );
    if (!ok) return;

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (expandedId === orderId) setExpandedId(null);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePaymentStatusChange(orderId: string, paymentStatus: "paid" | "pending" | "unpaid") {
    setUpdatingId(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });

    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus,
                status: paymentStatus === "paid" && o.status === "pending" ? "processing" : o.status,
              }
            : o,
        ),
      );
    }
    setUpdatingId(null);
  }

  if (loading) return <PageLoader text="Loading orders…" />;

  const filteredOrders = orders.filter((o) => {
    const isTabMatch = tab === "active" ? activeStatuses.includes(o.status) : historyStatuses.includes(o.status);
    if (!search) {
      if (!isTabMatch) return false;
      return true;
    }
    const s = search.toLowerCase();
    const fullName = `${o.firstName ?? ""} ${o.lastName ?? ""}`.toLowerCase();
    const userName = (o.user?.name ?? "").toLowerCase();
    
    return (
      o.id.toLowerCase().includes(s) ||
      (o.prescriptionId ?? "").toLowerCase().includes(s) ||
      o.email.toLowerCase().includes(s) ||
      fullName.includes(s) ||
      userName.includes(s) ||
      (o.phone ?? "").includes(s)
    );
  });
  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
  const historyCount = orders.filter((o) => historyStatuses.includes(o.status)).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Orders ({orders.length})
        </h1>
        
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search ID, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2.5 md:py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

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
            const canDelete =
              order.paymentStatus === "unpaid" && (order.status === "pending" || order.status === "cancelled");
            return (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-white overflow-hidden"
            >
              {/* Header row — always visible */}
              <div
                className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-5 hover:bg-muted-light/40"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-start gap-3 w-full sm:w-auto">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {order.firstName || order.user?.name || "Guest"} {order.lastName ?? ""}
                    </p>
                    <p className="text-xs text-muted truncate">{order.email}</p>
                    <p className="mt-0.5 text-[10px] md:text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] md:text-xs font-bold uppercase ${
                      order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {order.paymentStatus}
                    </span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                      className={`rounded-full border-0 px-3 py-1 text-[10px] md:text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[order.status] ?? "bg-muted-light text-muted"}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <p className="text-base md:text-lg font-bold text-foreground">
                      GH₵{order.total.toFixed(2)}
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted shrink-0" />
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
                              GH₵{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="mt-2 border-t border-border pt-2 space-y-1">
                          {order.shipping > 0 && (
                            <div className="flex justify-between text-xs text-muted">
                              <span>Shipping</span>
                              <span>GH₵{order.shipping.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-foreground">
                            <span>Total</span>
                            <span>GH₵{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-border bg-white p-3">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Payment</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted">Status</span>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                              order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          <div className="text-xs">
                            <p className="text-muted">Customer Reference</p>
                            <p className="mt-1 font-mono text-[11px] text-foreground break-all">
                              {order.paymentReference || "—"}
                            </p>
                          </div>

                          <div className="text-xs">
                            <p className="text-muted">MoMo Transaction ID</p>
                            <p className="mt-1 font-mono text-[11px] text-foreground break-all">
                              {order.paymentTransactionId || "—"}
                            </p>
                          </div>

                          {order.prescriptionId && (
                            <div className="text-xs">
                              <p className="text-muted">Prescription</p>
                              <a
                                href={`/admin/prescriptions?q=${encodeURIComponent(order.prescriptionId)}`}
                                className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                              >
                                {order.prescriptionId}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePaymentStatusChange(order.id, "paid");
                              }}
                              disabled={updatingId === order.id || order.paymentStatus === "paid"}
                              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                            >
                              Mark Paid
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(order.id);
                              }}
                              disabled={updatingId === order.id || !canDelete}
                              title={
                                canDelete
                                  ? "Delete order"
                                  : "Paid/shipped orders cannot be deleted. Cancel the order instead."
                              }
                              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </span>
                            </button>
                          </div>
                          <p className="text-[10px] text-muted">
                            Verify the MoMo transaction in MTN Merchant Portal first, then mark as paid.
                          </p>
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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading orders…" />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
