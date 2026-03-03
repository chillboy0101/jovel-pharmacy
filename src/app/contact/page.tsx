"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Contact Us
          </h1>
          <p className="text-lg text-white/80">
            We&apos;re here to help. Reach out anytime.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Address</h3>
                <p className="text-sm text-muted">
                  La Trade Fair, Giffard Road
                  <br />
                  La Nativity Presby Roadside, Accra
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Phone</h3>
                <p className="text-sm text-muted">+233 (0) 30 123 4567</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Email</h3>
                <p className="text-sm text-muted">
                  <a href="mailto:info@jovelpharmacy.com" className="hover:text-primary hover:underline">info@jovelpharmacy.com</a>
                  <span className="ml-1 text-xs text-muted/60">(General)</span>
                </p>
                <p className="text-sm text-muted">
                  <a href="mailto:care@jovelpharmacy.com" className="hover:text-primary hover:underline">care@jovelpharmacy.com</a>
                  <span className="ml-1 text-xs text-muted/60">(Customer Care)</span>
                </p>
                <p className="text-sm text-muted">
                  <a href="mailto:accounts@jovelpharmacy.com" className="hover:text-primary hover:underline">accounts@jovelpharmacy.com</a>
                  <span className="ml-1 text-xs text-muted/60">(Finance)</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Hours</h3>
                <p className="text-sm text-muted">
                  Mon – Sat: 8:00 AM – 9:00 PM
                  <br />
                  Sunday: 10:00 AM – 6:00 PM
                </p>
              </div>
            </div>

            {/* Live chat CTA */}
            <div className="rounded-2xl border border-primary/20 bg-primary-light p-5">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Live Chat
                  </h3>
                  <p className="text-xs text-muted">
                    Chat with a pharmacist in real-time
                  </p>
                </div>
              </div>
              <button className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
                Start Chat
              </button>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Jovel Pharmacy Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-0.2100%2C5.5900%2C-0.1600%2C5.6300&layer=mapnik&marker=5.6150%2C-0.1850"
                width="100%"
                height="220"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                allowFullScreen
              />
              <div className="flex items-center justify-between bg-muted-light px-4 py-2">
                <p className="text-xs text-muted">La Trade Fair, Giffard Road, Accra</p>
                <a
                  href="https://www.openstreetmap.org/?mlat=5.6150&mlon=-0.1850#map=15/5.6150/-0.1850"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open in Maps →
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-16 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  Message Sent!
                </h2>
                <p className="mb-6 text-muted">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="rounded-2xl border border-border bg-white p-8"
              >
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  Send Us a Message
                </h2>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="First name"
                      required
                      className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      required
                      className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <select className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-muted outline-none focus:border-primary">
                    <option>Select a topic</option>
                    <option>Prescription inquiry</option>
                    <option>Product question</option>
                    <option>Delivery issue</option>
                    <option>Consultation request</option>
                    <option>General feedback</option>
                    <option>Other</option>
                  </select>
                  <textarea
                    placeholder="Your message"
                    required
                    rows={5}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
