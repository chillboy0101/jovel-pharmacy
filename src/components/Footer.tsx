"use client";

import Link from "next/link";
import Logo from "./Logo";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

const footerLinks = {
  Shop: [
    { href: "/shop", label: "All Products" },
    { href: "/shop?cat=wellness", label: "Wellness & Vitamins" },
    { href: "/shop?cat=skincare", label: "Skincare" },
    { href: "/shop?cat=devices", label: "Health Devices" },
  ],
  Services: [
    { href: "/services", label: "All Services" },
    { href: "/prescriptions", label: "Prescriptions" },
    { href: "/consult", label: "Consultations" },
    { href: "/services#delivery", label: "Home Delivery" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
  ],
};

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    null | { ok: boolean; text: string }
  >(null);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  async function subscribeNewsletter() {
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterSubmitting(true);
    setNewsletterStatus(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setNewsletterStatus({ ok: true, text: "✓ Subscribed" });
        setNewsletterEmail("");
      } else {
        setNewsletterStatus({ ok: false, text: data.error || "Subscribe failed" });
      }
    } catch {
      setNewsletterStatus({ ok: false, text: "Subscribe failed" });
    } finally {
      setNewsletterSubmitting(false);
      setTimeout(() => setNewsletterStatus(null), 3500);
    }
  }

  return (
    <footer className="border-t border-border bg-foreground text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Logo className="text-white" />
            </div>
            <p className="mb-4 max-w-sm text-sm leading-relaxed text-white/60">
              Your Community Pharmacy, Where Service Counts
            </p>
            {/* Contact info */}
            <div className="mb-6 space-y-1.5">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Jovel%20Pharmacy%2C%20La%20Trade%20Fair%2C%20Giffard%20Road%2C%20Accra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white/50 hover:text-primary"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                La Trade Fair, Giffard Road
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=5.572812%2C-0.155189"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white/50 hover:text-primary"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                La Nativity Road
              </a>
              <p className="flex items-center gap-2 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                La Trade Fair, Giffard: <a href="tel:+233508396646" className="hover:text-primary">+233 50 839 6646</a>
              </p>
              <p className="flex items-center gap-2 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                La Trade Fair, Giffard (Landline): <a href="tel:+233302788321" className="hover:text-primary">+233 30 278 8321</a>
              </p>
              <p className="flex items-center gap-2 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                La Nativity: <a href="tel:+233203418087" className="hover:text-primary">+233 20 341 8087</a>
              </p>
              <p className="flex items-center gap-2 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                La Nativity (Landline): <a href="tel:+233302738874" className="hover:text-primary">+233 30 273 8874</a>
              </p>
              <a href="mailto:info@jovelpharmacy.com" className="flex items-center gap-2 text-xs text-white/50 hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                info@jovelpharmacy.com
              </a>
              <a href="mailto:care@jovelpharmacy.com" className="flex items-center gap-2 text-xs text-white/50 hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                care@jovelpharmacy.com
              </a>
              <a href="mailto:accounts@jovelpharmacy.com" className="flex items-center gap-2 text-xs text-white/50 hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                accounts@jovelpharmacy.com
              </a>
            </div>
            {/* Newsletter */}
            <div className="flex max-w-sm gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Mail className="h-4 w-4 text-white/40" />
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void subscribeNewsletter();
                    }
                  }}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
              <button
                type="button"
                onClick={() => void subscribeNewsletter()}
                disabled={newsletterSubmitting}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                Subscribe
              </button>
            </div>

            {newsletterStatus && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  newsletterStatus.ok ? "text-green-300" : "text-red-300"
                }`}
              >
                {newsletterStatus.text}
              </p>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/60 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Jovel Pharmacy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://facebook.com/jovelpharmacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-primary hover:text-white"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/jovelpharmacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-primary hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com/jovelpharmacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-primary hover:text-white"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
