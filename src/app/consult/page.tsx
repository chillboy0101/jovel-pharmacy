"use client";

import { useState } from "react";
import { Video, MapPin, Phone, CheckCircle2, Calendar, Clock } from "lucide-react";

const consultTypes = [
  {
    id: "video",
    icon: <Video className="h-5 w-5" />,
    label: "Video Call",
    desc: "Secure video consultation from home",
  },
  {
    id: "instore",
    icon: <MapPin className="h-5 w-5" />,
    label: "In-Store",
    desc: "Visit us for a private consultation",
  },
  {
    id: "phone",
    icon: <Phone className="h-5 w-5" />,
    label: "Phone Call",
    desc: "Quick phone consultation",
  },
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

export default function ConsultPage() {
  const [submitted, setSubmitted] = useState(false);
  const [consultType, setConsultType] = useState("video");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState<"15" | "30">("15");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      type: consultType,
      duration: parseInt(duration),
      date: fd.get("date") as string,
      time: selectedTime,
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string,
      notes: fd.get("notes") as string || null,
    };
    if (!body.time) { setSubmitError("Please select a time slot."); setSubmitting(false); return; }
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Booking failed. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Consultation Booked!
        </h1>
        <p className="mb-2 text-muted">
          Your {consultTypes.find((c) => c.id === consultType)?.label} consultation
          has been scheduled.
        </p>
        <p className="mb-8 text-sm text-muted">
          We&apos;ll send a confirmation with details to your email.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Book a Consultation
          </h1>
          <p className="text-lg text-white/80">
            Speak with a licensed pharmacist — in person, by phone, or via
            secure video call.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Consultation Type
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {consultTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setConsultType(t.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all ${
                    consultType === t.id
                      ? "border-primary bg-primary-light"
                      : "border-border bg-white hover:border-primary/30"
                  }`}
                >
                  <span
                    className={
                      consultType === t.id ? "text-primary" : "text-muted"
                    }
                  >
                    {t.icon}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {t.label}
                  </span>
                  <span className="text-xs text-muted">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Session Duration
            </h2>
            <div className="flex gap-3">
              {[
                { val: "15" as const, label: "15 Minutes", price: "Free" },
                { val: "30" as const, label: "30 Minutes", price: "GH₵25" },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDuration(d.val)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-4 transition-all ${
                    duration === d.val
                      ? "border-primary bg-primary-light"
                      : "border-border bg-white hover:border-primary/30"
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Clock className="h-4 w-4" /> {d.label}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      d.price === "Free" ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {d.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Calendar className="h-5 w-5" /> Select Date
            </h2>
            <input
              type="date"
              name="date"
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Time */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Available Times
            </h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    selectedTime === slot
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-foreground hover:border-primary/30"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Your Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Full name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Briefly describe your concern (optional)"
              rows={3}
              className="mt-4 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Booking…" : `Confirm Booking${duration === "30" ? " — GH₵25" : " — Free"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
