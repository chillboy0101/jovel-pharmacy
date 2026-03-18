"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ArrowLeft,
  Menu,
  X,
  Info,
  FileText,
  CalendarClock,
} from "lucide-react";
import Logo from "@/components/Logo";

type NavBadgeCounts = {
  prescriptions: number;
  consultations: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: keyof NavBadgeCounts;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  {
    href: "/admin/prescriptions",
    label: "Prescriptions",
    icon: FileText,
    badgeKey: "prescriptions",
  },
  {
    href: "/admin/consultations",
    label: "Consultations",
    icon: CalendarClock,
    badgeKey: "consultations",
  },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/about", label: "About Page", icon: Info },
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
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badges, setBadges] = useState<NavBadgeCounts>({
    prescriptions: 0,
    consultations: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const res = await fetch("/api/admin/notifications", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) return;
        const data = (await res.json()) as Partial<NavBadgeCounts>;
        if (cancelled) return;

        setBadges({
          prescriptions: typeof data.prescriptions === "number" ? data.prescriptions : 0,
          consultations: typeof data.consultations === "number" ? data.consultations : 0,
        });
      } catch {
        // Ignore: badges are non-critical UI.
      }
    }

    void loadCounts();
    const interval = setInterval(loadCounts, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-muted-light">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Admin Panel</h2>
        </div>
        <NavLinks pathname={pathname} badges={badges} />
      </aside>

      {/* Mobile: full-width column layout */}
      <div className="flex flex-1 flex-col lg:hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center border-b border-border bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-foreground/70 hover:bg-muted-light transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-foreground">Admin Panel</h2>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[60]">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between p-6">
                <Logo className="-ml-1" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-muted-light transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
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
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white p-4 shadow-sm">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Desktop content */}
      <main className="hidden flex-1 p-8 lg:block">{children}</main>
    </div>
  );
}
