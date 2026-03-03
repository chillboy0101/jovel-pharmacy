"use client";

import { useState } from "react";
import { Calendar, Download, ExternalLink, Mail, Phone } from "lucide-react";

type PressRelease = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category: string;
};

const pressReleases: PressRelease[] = [
  {
    id: "1",
    title: "Jovel Pharmacy Launches New Online Consultation Service",
    date: "2026-02-15",
    category: "Product Launch",
    excerpt: "Patients can now book video consultations with licensed pharmacists from the comfort of their homes.",
    content: "Jovel Pharmacy is proud to announce the launch of our new online consultation service, making healthcare more accessible to our community. Patients can now schedule video, phone, or in-store consultations with our licensed pharmacists for medication reviews, health screenings, and wellness advice. This service is part of our commitment to providing convenient, personalized care to all our customers.",
  },
  {
    id: "2",
    title: "Jovel Pharmacy Expands to Three New Locations",
    date: "2026-01-20",
    category: "Company News",
    excerpt: "New branches opening in Kumasi, Takoradi, and Tema to serve more communities across Ghana.",
    content: "We are excited to announce the expansion of Jovel Pharmacy with three new locations opening this quarter. Our new branches in Kumasi, Takoradi, and Tema will bring our trusted pharmacy services to more communities across Ghana. Each location will feature our full range of prescription services, wellness products, and health consultations, staffed by experienced pharmacists dedicated to exceptional patient care.",
  },
  {
    id: "3",
    title: "Jovel Pharmacy Recognized as Best Pharmacy Chain 2025",
    date: "2025-12-10",
    category: "Awards",
    excerpt: "Ghana Healthcare Excellence Awards honors Jovel Pharmacy for outstanding patient care and community service.",
    content: "Jovel Pharmacy has been awarded 'Best Pharmacy Chain 2025' by the Ghana Healthcare Excellence Awards. This recognition celebrates our commitment to providing exceptional patient care, maintaining the highest quality standards, and serving our community with integrity. We are honored to receive this award and remain dedicated to improving healthcare access for all Ghanaians.",
  },
  {
    id: "4",
    title: "Partnership with Local Health Clinics for Better Care Coordination",
    date: "2025-11-05",
    category: "Partnerships",
    excerpt: "New collaboration aims to improve medication management and patient outcomes through integrated care.",
    content: "Jovel Pharmacy has partnered with leading health clinics across Accra to enhance care coordination and medication management. This partnership enables seamless prescription transfers, real-time medication reviews, and better communication between healthcare providers. Our goal is to improve patient outcomes by ensuring continuity of care and reducing medication errors.",
  },
];

export default function PressPage() {
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null);

  if (selectedRelease) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <button
          onClick={() => setSelectedRelease(null)}
          className="mb-6 text-sm font-medium text-primary hover:underline"
        >
          ← Back to press releases
        </button>

        <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="rounded-full bg-primary-light px-2.5 py-1 font-medium text-primary">
              {selectedRelease.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(selectedRelease.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="mb-6 text-3xl font-bold text-foreground">
            {selectedRelease.title}
          </h1>

          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed">{selectedRelease.content}</p>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="mb-3 text-sm font-bold text-foreground">Media Contact</h3>
            <div className="space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:press@jovelpharmacy.com" className="hover:text-primary">
                  press@jovelpharmacy.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +233 (0) 30 123 4567
              </p>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Press & Media
          </h1>
          <p className="text-lg text-white/80">
            Latest news, announcements, and media resources from Jovel Pharmacy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        {/* Media Kit */}
        <div className="mb-12 rounded-2xl border border-primary/20 bg-primary-light p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-foreground">Media Kit</h2>
          <p className="mb-6 text-sm text-muted">
            Download our brand assets, logos, and company information for media use.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white">
              <Download className="h-4 w-4" /> Brand Guidelines (PDF)
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white">
              <Download className="h-4 w-4" /> Logo Pack (ZIP)
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white">
              <Download className="h-4 w-4" /> Company Fact Sheet
            </button>
          </div>
        </div>

        {/* Press Releases */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release) => (
              <div
                key={release.id}
                className="rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="rounded-full bg-muted-light px-2 py-0.5 font-medium">
                        {release.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(release.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">
                      {release.title}
                    </h3>
                    <p className="text-sm text-muted">{release.excerpt}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRelease(release)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    Read More <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                  href="mailto:press@jovelpharmacy.com"
                  className="text-sm text-primary hover:underline"
                >
                  press@jovelpharmacy.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted-light p-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <p className="text-sm text-muted">+233 (0) 30 123 4567</p>
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
