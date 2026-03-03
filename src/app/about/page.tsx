"use client";

import Image from "next/image";
import { Heart, Shield, Users, Award } from "lucide-react";
import { useState, useEffect } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  imageUrl: string | null;
};

const values = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Patient-Centred Care",
    description:
      "Every decision starts with what's best for our patients. We listen, advise, and follow through.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Trust & Transparency",
    description:
      "Genuine products, honest pricing, and clear communication — no hidden fees, ever.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community First",
    description:
      "We're your neighbourhood pharmacy. We know your name, your health history, and your goals.",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Clinical Excellence",
    description:
      "Our pharmacists hold advanced certifications and pursue continuous education every year.",
  },
];

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTeam(data); });
  }, []);

  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            About Jovel Pharmacy
          </h1>
          <p className="text-lg text-white/80">
            A family-owned pharmacy built on trust, expertise, and genuine care
            for our community.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
              Our Story
            </h2>
            <p className="mb-4 leading-relaxed text-foreground/80">
              Founded in 2010 by Dr. Elena Jovel, our pharmacy was born from a
              simple belief: everyone deserves personalised, accessible
              healthcare without the impersonal feel of big-box chains.
            </p>
            <p className="leading-relaxed text-foreground/80">
              What started as a single storefront has grown into a full-service
              health destination — offering prescription management, clinical
              consultations, health screenings, immunizations, and a curated
              wellness shop — all powered by a team of dedicated pharmacists who
              know their patients by name.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-primary-light p-16">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary text-5xl text-white">
              🏥
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted-light py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground">
            What We Stand For
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  {v.icon}
                </div>
                <h3 className="mb-2 text-sm font-bold text-foreground">
                  {v.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20" id="team">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground">
            Meet Our Team
          </h2>
          <p className="mb-12 text-center text-sm text-muted">
            Dedicated professionals committed to your health and wellbeing.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <div
                key={m.id}
                className="flex flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Photo or initials avatar */}
                <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary-light">
                  {m.imageUrl ? (
                    <Image
                      src={m.imageUrl}
                      alt={m.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-light text-2xl font-bold text-primary">
                      {m.avatar}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground">{m.name}</h3>
                <p className="mb-3 text-xs font-semibold text-primary">
                  {m.role}
                </p>
                <p className="text-xs leading-relaxed text-muted">{m.bio}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted/60">
            Upload team photos in Admin → Team.
          </p>
        </div>
      </section>

      {/* Certifications */}
      <section className="border-t border-border bg-muted-light py-16" id="certifications">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            Certifications & Accreditations
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              "State Board Licensed",
              "NABP Accredited",
              "ACHC Certified",
              "HIPAA Compliant",
            ].map((cert) => (
              <span
                key={cert}
                className="rounded-full border border-primary/20 bg-white px-5 py-2 text-sm font-medium text-primary"
              >
                ✓ {cert}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
