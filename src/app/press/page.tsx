"use client";

import { Mail, Phone } from "lucide-react";

export default function PressPage() {
  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Press & Media
          </h1>
          <p className="text-lg text-white/80">
            For press enquiries and brand assets.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="mb-10 rounded-2xl border border-border bg-white p-6 md:p-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Press releases</h2>
          <p className="text-sm text-muted">No press releases yet.</p>
        </div>

        {/* Media Contact */}
        <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-foreground">Media Inquiries</h2>
          <p className="mb-6 text-sm text-muted">
            For press inquiries, interview requests, or additional information, please contact our media relations team.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-muted-light p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a
                  href="mailto:info@jovelpharmacy.com"
                  className="text-sm text-primary hover:underline"
                >
                  info@jovelpharmacy.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted-light p-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <p className="text-sm text-muted">
                  <a href="tel:+233508396646" className="hover:text-primary hover:underline">+233 50 839 6646</a>
                  <span className="text-muted"> · </span>
                  <a href="tel:+233302788321" className="hover:text-primary hover:underline">+233 30 278 8321</a>
                </p>
                <p className="text-xs text-muted">Mon–Fri, 9 AM – 5 PM GMT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-8 rounded-xl border border-border bg-muted-light p-6 text-center">
          <p className="mb-3 text-sm font-medium text-foreground">Follow us for updates</p>
          <div className="flex justify-center gap-3">
            {["Facebook", "Twitter", "LinkedIn", "Instagram"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-muted hover:bg-primary hover:text-white"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
