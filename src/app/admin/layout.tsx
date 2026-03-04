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
          orders: Array.isArray(orders) ? orders.filter((o: any) => o.status === "pending").length : 0,
          prescriptions: Array.isArray(prescriptions) ? prescriptions.filter((p: any) => p.status === "pending").length : 0,
          consultations: Array.isArray(consultations) ? consultations.filter((c: any) => c.status === "pending").length : 0,
          messages: Array.isArray(messages) ? messages.filter((m: any) => m.status === "pending").length : 0,
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
              className="rounded-lg p-2 text-foreground/70 hover:bg-muted-light"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium text-muted">Admin Panel</p>
              <p className="text-sm font-bold text-foreground leading-tight">{currentPage}</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Store
          </Link>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Admin Panel</h2>
                  <p className="text-xs text-muted">Jovel Pharmacy</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-muted hover:bg-muted-light"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
                badges={badges}
              />
            </aside>
          </div>
        )}


        {/* Mobile content */}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Desktop content */}
      <main className="hidden flex-1 p-8 lg:block">{children}</main>
    </div>
  );
}
