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
  const mainBranch = {
    label: "La Trade Fair, Giffard Road, Accra",
    query: "Jovel Pharmacy La Trade Fair Giffard Road Accra",
  };

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
                  La Nativity Road
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Phone</h3>
                <p className="text-sm text-muted">
                  La Trade Fair, Giffard :{" "}
                  <a href="tel:+233508396646" className="hover:text-primary hover:underline">+233 50 839 6646</a>
                </p>
                <p className="text-sm text-muted">
                  La Trade Fair, Giffard (Landline) :{" "}
                  <a href="tel:+233302788321" className="hover:text-primary hover:underline">+233 30 278 8321</a>
                </p>
                <p className="text-sm text-muted">
                  La Nativity :{" "}
                  <a href="tel:+233203418087" className="hover:text-primary hover:underline">+233 20 341 8087</a>
                </p>
                <p className="text-sm text-muted">
                  La Nativity (Landline) :{" "}
                  <a href="tel:+233302738874" className="hover:text-primary hover:underline">+233 30 273 8874</a>
                </p>
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
                </p>
                <p className="text-sm text-muted">
                  <a href="mailto:care@jovelpharmacy.com" className="hover:text-primary hover:underline">care@jovelpharmacy.com</a>
                </p>
                <p className="text-sm text-muted">
                  <a href="mailto:accounts@jovelpharmacy.com" className="hover:text-primary hover:underline">accounts@jovelpharmacy.com</a>
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
                  Mon – Sat: 7:30 AM – 10:00 PM
                  <br />
                  Sundays: 2:00 PM – 10:00 PM
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
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Start Chat
              </button>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="flex items-center justify-between gap-2 bg-white px-4 py-3">
                <p className="text-xs font-semibold text-foreground">Map</p>
              </div>
              <iframe
                title="Jovel Pharmacy Location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mainBranch.query)}&output=embed`}
                width="100%"
                height="220"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                allowFullScreen
              />
              <div className="flex items-center justify-between bg-muted-light px-4 py-2">
                <p className="text-xs text-muted">{mainBranch.label}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mainBranch.query)}`}
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const data = Object.fromEntries(fd.entries());
                  
                  try {
                    const res = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(data),
                    });
                    
                    if (res.ok) {
                      setSubmitted(true);
                    } else {
                      const err = await res.json();
                      alert(err.error || "Failed to send message. Please try again.");
                    }
                  } catch (err) {
                    alert("Network error. Please try again.");
                  }
                }}
                className="rounded-2xl border border-border bg-white p-8"
              >
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  Send Us a Message
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="First name"
                    required
                    name="firstName"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    required
                    name="lastName"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  name="email"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary mt-4"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number (e.g. 0244123456)"
                  required
                  pattern="[0-9]{7,15}"
                  title="Please enter a valid phone number (7-15 digits)"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                  }}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary mt-4"
                />
                <select 
                  name="topic"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-muted outline-none focus:border-primary mt-4"
                >
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
                  name="message"
                  rows={5}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary mt-4"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark mt-6"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
