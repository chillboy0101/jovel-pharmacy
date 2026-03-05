"use client";

import { Mail } from "lucide-react";

export default function CareersPage() {
  return (
    <div>
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Careers
          </h1>
          <p className="text-lg text-white/80">
            Your Community Pharmacy where service counts.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            We are not hiring currently
          </h2>
          <p className="text-sm text-muted">
            We&apos;ll share opportunities here when roles open.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-muted-light p-4">
            <p className="text-sm font-semibold text-foreground">General enquiries</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Mail className="h-4 w-4" />
              <a href="mailto:info@jovelpharmacy.com" className="text-primary hover:underline">
                info@jovelpharmacy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
