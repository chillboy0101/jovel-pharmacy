"use client";

import { useState } from "react";
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
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/consultations", label: "Consultations", icon: Calendar },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/chat", label: "Chats", icon: MessageCircle },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
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
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors lg:py-2.5 ${
                isActive
                  ? "bg-primary-light text-primary-dark"
                  : "text-foreground/70 hover:bg-muted-light hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
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
        <NavLinks pathname={pathname} />
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
