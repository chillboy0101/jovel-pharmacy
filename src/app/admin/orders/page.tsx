"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Orders ({orders.length})
      </h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {order.firstName} {order.lastName}
                  </p>
                  <p className="text-xs text-muted">{order.email}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[order.status] ?? "bg-muted-light text-muted"}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-lg font-bold text-foreground">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="space-y-1 rounded-lg bg-muted-light p-3">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground/80">
                      {item.product.emoji} {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
