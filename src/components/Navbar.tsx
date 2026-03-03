"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Services" },
  { href: "/prescriptions", label: "Prescriptions" },
  { href: "/consult", label: "Consult" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Top bar */}
      <div className="hidden border-b border-border bg-muted-light md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> (555) 123-4567
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Mon–Sat 8 AM – 9 PM · Sun 10 AM – 6 PM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Free delivery on orders over $35</span>
            <span>·</span>
            <Link href="/prescriptions" className="hover:text-primary">
              Transfer Rx
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary-light text-primary-dark"
                    : "text-foreground/70 hover:bg-muted-light hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-primary-light text-primary-dark"
                    : "text-foreground/70 hover:bg-muted-light hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-lg p-2 text-foreground/70 transition-colors hover:bg-muted-light"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/cart"
              className="relative rounded-lg p-2 text-foreground/70 transition-colors hover:bg-muted-light"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className="rounded-lg p-2 text-foreground/70 transition-colors hover:bg-muted-light"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-foreground/70 lg:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-border/50 bg-white px-4 py-3 animate-fade-in md:px-6">
            <form
              className="mx-auto max-w-2xl"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
            >
              <div className="flex items-center gap-2 rounded-xl bg-muted-light px-4 py-2.5">
                <Search className="h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medications, vitamins, devices…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark"
                  >
                    Search
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-2xl animate-slide-in-right">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-primary-light text-primary-dark"
                      : "text-foreground/70 hover:bg-muted-light"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-primary-light text-primary-dark"
                      : "text-foreground/70 hover:bg-muted-light"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" /> Admin Panel
                </Link>
              )}
            </nav>
            <div className="mt-6 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-xs text-muted">
                <Phone className="h-3 w-3" /> (555) 123-4567
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Clock className="h-3 w-3" /> Mon–Sat 8 AM – 9 PM
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
