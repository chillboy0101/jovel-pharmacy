"use client";

import { useEffect, useState } from "react";
import { Package, Users, Info } from "lucide-react";
import type { Product } from "@/lib/types";
import PageLoader from "@/components/PageLoader";

type DashboardData = {
  productCount: number;
  orderCount: number;
  revenue: number;
  teamCount: number;
  lowStock: Product[];
  expiringSoon: Product[];
  recentOrders: Array<{
    id: string;
    email: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  totalProfit: number;
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const [productsRes, ordersRes, teamRes] = await Promise.all([
        fetch("/api/products?all=1&fields=adminList&pageSize=1"),
        fetch("/api/orders"),
        fetch("/api/admin/team"),
      ]);
      const products: Product[] = productsRes.ok ? await productsRes.json() : [];
      const productsTotal = Number(productsRes.headers.get("X-Total-Count"));
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      const team = teamRes.ok ? await teamRes.json() : [];

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let totalProfit = 0;
      if (Array.isArray(orders)) {
        orders.forEach((order: any) => {
          if (order?.status !== "cancelled") {
            const items = Array.isArray(order?.items) ? order.items : [];
            items.forEach((item: any) => {
              const cost = typeof item?.costPrice === "number" ? item.costPrice : 0;
              const price = typeof item?.price === "number" ? item.price : 0;
              const quantity = typeof item?.quantity === "number" ? item.quantity : 0;
              totalProfit += (price - cost) * quantity;
            });
          }
        });
      }

      setData({
        productCount: Number.isFinite(productsTotal) ? productsTotal : products.length,
        orderCount: Array.isArray(orders) ? orders.length : 0,
        revenue: Array.isArray(orders)
          ? orders.reduce(
              (sum: number, o: any) =>
                o?.status !== "cancelled" && typeof o?.total === "number" ? sum + o.total : sum,
              0,
            )
          : 0,
        totalProfit,
        teamCount: Array.isArray(team) ? team.length : 0,
        lowStock: products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock),
        expiringSoon: products.filter((p) => {
          if (!p.expiryDate) return false;
          const expiry = new Date(p.expiryDate);
          return expiry <= thirtyDaysFromNow;
        }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()),
        recentOrders: Array.isArray(orders) ? orders.slice(0, 5) : [],
      });
    }
    load();
  }, []);

  if (!data) return <PageLoader text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Total Products",
            value: data.productCount,
            icon: Package,
            color: "text-primary bg-primary-light",
          },
          {
            label: "Team Members",
            value: data.teamCount,
            icon: Users,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Page Status",
            value: "Live",
            icon: Info,
            color: "text-emerald-600 bg-emerald-50",
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
        {/* Quick Links */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a 
              href="/admin/team" 
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted-light"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Manage Team</p>
                <p className="text-xs text-muted">Update staff profiles</p>
              </div>
            </a>
            <a 
              href="/admin/about" 
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted-light"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Edit About Page</p>
                <p className="text-xs text-muted">Update company info</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            System Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-muted">Admin Panel Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-muted">Database Connection</span>
              <span className="text-sm font-medium text-primary">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Last Update</span>
              <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
