import Link from "next/link";
import Logo from "./Logo";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";

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
    { href: "/about#careers", label: "Careers" },
    { href: "/about#press", label: "Press" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="8"
                    y="2"
                    width="6"
                    height="18"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="2"
                    y="8"
                    width="18"
                    height="6"
                    rx="1.5"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight text-white">
                  Jovel
                </span>
                <span className="text-[11px] font-medium tracking-widest uppercase text-primary">
                  Pharmacy
                </span>
              </div>
            </div>
            <p className="mb-4 max-w-sm text-sm leading-relaxed text-white/60">
              Your trusted neighbourhood pharmacy — delivering premium care,
              expert consultations, and quality products since 2010.
            </p>
            {/* Contact info */}
            <div className="mb-6 space-y-1.5">
              <p className="flex items-center gap-2 text-xs text-white/50">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                La Trade Fair, Giffard Road, Accra
              </p>
              <a href="mailto:info@jovelpharmacy.com" className="flex items-center gap-2 text-xs text-white/50 hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                info@jovelpharmacy.com
              </a>
              <a href="mailto:care@jovelpharmacy.com" className="flex items-center gap-2 text-xs text-white/50 hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                care@jovelpharmacy.com
              </a>
            </div>
            {/* Newsletter */}
            <div className="flex max-w-sm gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Mail className="h-4 w-4 text-white/40" />
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
                Subscribe
              </button>
            </div>
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
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-white/40 transition-colors hover:text-primary"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="text-white/40 transition-colors hover:text-primary"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="text-white/40 transition-colors hover:text-primary"
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
