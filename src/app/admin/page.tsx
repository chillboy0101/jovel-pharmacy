"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, AlertTriangle, DollarSign } from "lucide-react";
import type { Product } from "@/lib/types";
import PageLoader from "@/components/PageLoader";

type DashboardData = {
  productCount: number;
  orderCount: number;
  revenue: number;
  lowStock: Product[];
  recentOrders: Array<{
    id: string;
    email: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
      ]);
      const products: Product[] = productsRes.ok ? await productsRes.json() : [];
      const orders = ordersRes.ok ? await ordersRes.json() : [];

      setData({
        productCount: products.length,
        orderCount: orders.length,
        revenue: orders.reduce(
          (sum: number, o: { total: number }) => sum + o.total,
          0,
        ),
        lowStock: products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock),
        recentOrders: orders.slice(0, 5),
      });
    }
    load();
  }, []);

  if (!data) return <PageLoader text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Products",
            value: data.productCount,
            icon: Package,
            color: "text-primary bg-primary-light",
          },
          {
            label: "Total Orders",
            value: data.orderCount,
            icon: ShoppingBag,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Revenue",
            value: `$${data.revenue.toFixed(2)}`,
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Low Stock Items",
            value: data.lowStock.length,
            icon: AlertTriangle,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-5"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low stock alerts */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-foreground">
            Low Stock Alerts
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-muted">All products are well stocked.</p>
          ) : (
            <div className="space-y-2">
              {data.lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted-light px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-600"}`}
                  >
                    {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-foreground">
            Recent Orders
          </h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg bg-muted-light px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.id.slice(0, 12)}…
                    </p>
                    <p className="text-xs text-muted">{order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      ${order.total.toFixed(2)}
                    </p>
                    <span className="text-xs font-medium capitalize text-primary">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
