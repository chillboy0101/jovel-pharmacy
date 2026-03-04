"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  MessageCircle,
  Users,
  ArrowLeft,
  Calendar,
  FileText,
  Menu,
  X,
  Mail,
} from "lucide-react";

type NavBadgeCounts = {
  orders: number;
  prescriptions: number;
  consultations: number;
  messages: number;
};

type StatusLike = {
  status?: unknown;
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badgeKey: "orders" as keyof NavBadgeCounts },
  { href: "/admin/consultations", label: "Consultations", icon: Calendar, badgeKey: "consultations" as keyof NavBadgeCounts },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: FileText, badgeKey: "prescriptions" as keyof NavBadgeCounts },
  { href: "/admin/messages", label: "Messages", icon: Mail, badgeKey: "messages" as keyof NavBadgeCounts },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/chat", label: "Chats", icon: MessageCircle },
];

function NavLinks({
  pathname,
  onNavigate,
  badges,
}: {
  pathname: string;
  onNavigate?: () => void;
  badges: NavBadgeCounts;
}) {
  return (
    <>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors lg:py-2.5 ${
                isActive
                  ? "bg-primary-light text-primary-dark"
                  : "text-foreground/70 hover:bg-muted-light hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </div>
              {badgeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badges, setBadges] = useState<NavBadgeCounts>({
    orders: 0,
    prescriptions: 0,
    consultations: 0,
    messages: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [ordersRes, prescriptionsRes, consultationsRes, messagesRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/prescriptions"),
          fetch("/api/consultations"),
          fetch("/api/contact"),
        ]);

        const [orders, prescriptions, consultations, messages] = await Promise.all([
          ordersRes.ok ? ordersRes.json() : [],
          prescriptionsRes.ok ? prescriptionsRes.json() : [],
          consultationsRes.ok ? consultationsRes.json() : [],
          messagesRes.ok ? messagesRes.json() : [],
        ]);

        setBadges({
          orders: Array.isArray(orders)
            ? (orders as StatusLike[]).filter((o) => o.status === "pending").length
            : 0,
          prescriptions: Array.isArray(prescriptions)
            ? (prescriptions as StatusLike[]).filter((p) => p.status === "pending").length
            : 0,
          consultations: Array.isArray(consultations)
            ? (consultations as StatusLike[]).filter((c) => c.status === "pending").length
            : 0,
          messages: Array.isArray(messages)
            ? (messages as StatusLike[]).filter((m) => m.status === "pending").length
            : 0,
        });
      } catch (err) {
        console.error("Failed to fetch badge counts", err);
      }
    };

    fetchCounts();
    // Poll every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [pathname]); // Refresh counts when navigating

  const currentPage =
    navItems.find((n) =>
      n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href),
    )?.label ?? "Admin";

  return (
    <div className="flex min-h-screen bg-muted-light">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Admin Panel</h2>
          <p className="text-xs text-muted">Jovel Pharmacy</p>
        </div>
        <NavLinks pathname={pathname} badges={badges} />
      </aside>

      {/* Mobile: full-width column layout */}
      <div className="flex flex-1 flex-col lg:hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-foreground/70 hover:bg-muted-light transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">Jovel</p>
                <p className="text-[8px] font-medium text-muted uppercase tracking-tighter leading-none mt-0.5">Pharmacy</p>
              </div>
            </Link>
          </div>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:bg-muted-light transition-all"
            title="Back to Store"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[60]">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted-light/30">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Admin Panel</h2>
                    <p className="text-[10px] text-muted">Management Console</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-muted hover:bg-muted-light hover:text-foreground transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setDrawerOpen(false)}
                  badges={badges}
                />
              </div>
            </aside>
          </div>
        )}


        {/* Mobile content wrapper with better padding/scrolling */}
        <main className="flex-1 overflow-x-hidden pb-10">
          <div className="p-4">
            <div className="mb-6 lg:hidden">
              <h1 className="text-xl font-bold text-foreground leading-tight">{currentPage}</h1>
              <div className="mt-1 h-1 w-8 rounded-full bg-primary" />
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Desktop content */}
      <main className="hidden flex-1 p-8 lg:block">{children}</main>
    </div>
  );
}
