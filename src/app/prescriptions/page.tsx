"use client";

import { useState, useRef } from "react";
import {
  Upload,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";

type Tab = "upload" | "transfer" | "refill";

export default function PrescriptionsPage() {
  const [tab, setTab] = useState<Tab>("upload");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, type: Tab) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const fd = new FormData(e.currentTarget);

    let fileUrl: string | null = null;
    if (type === "upload" && selectedFile) {
      const uploadFd = new FormData();
      uploadFd.append("file", selectedFile);
      try {
        const upRes = await fetch("/api/upload", { method: "POST", body: uploadFd });
        if (upRes.ok) {
          const { url } = await upRes.json();
          fileUrl = url;
        }
      } catch {
        // file upload optional — continue without it
      }
    }

    const body: Record<string, string | null> = {
      type,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      notes: (fd.get("notes") as string) || null,
      fileUrl,
      currentPharmacy: (fd.get("currentPharmacy") as string) || null,
      currentPharmacyPhone: (fd.get("currentPharmacyPhone") as string) || null,
      rxNumber: (fd.get("rxNumber") as string) || null,
      medications: (fd.get("medications") as string) || null,
      dob: (fd.get("dob") as string) || null,
      pickup: (fd.get("pickup") as string) || null,
    };

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Submission failed. Please try again.");
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
          Request Submitted!
        </h1>
        <p className="mb-6 text-muted">
          We&apos;ll review your {tab === "upload" ? "prescription" : tab === "transfer" ? "transfer request" : "refill request"} and
          get back to you within 1 business hour.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Submit Another Request
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
            Prescription Services
          </h1>
          <p className="text-lg text-white/80">
            Upload, transfer, or refill your prescriptions — we make it easy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-xl bg-muted-light p-1.5">
          {[
            { key: "upload" as Tab, label: "Upload Rx", icon: <Upload className="h-4 w-4" /> },
            { key: "transfer" as Tab, label: "Transfer Rx", icon: <ArrowRightLeft className="h-4 w-4" /> },
            { key: "refill" as Tab, label: "Refill", icon: <RefreshCw className="h-4 w-4" /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Upload form */}
        {tab === "upload" && (
          <form onSubmit={(e) => handleSubmit(e, "upload")} className="space-y-5">
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
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            {/* Upload zone — entire area is clickable */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="rx-file"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                  dragging
                    ? "border-primary bg-primary-light/30"
                    : selectedFile
                    ? "border-primary bg-primary-light/10"
                    : "border-border bg-muted-light hover:border-primary/50 hover:bg-primary-light/10"
                }`}
              >
                {selectedFile ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-primary" />
                    <p className="mb-1 text-sm font-semibold text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-10 w-10 text-muted" />
                    <p className="mb-1 text-sm font-semibold text-foreground">
                      Click anywhere here to browse
                    </p>
                    <p className="mb-1 text-xs text-muted">or drag & drop your prescription</p>
                    <p className="text-xs text-muted/60">PDF, JPG, PNG — max 10 MB</p>
                  </>
                )}
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-red-500"
                >
                  <X className="h-3 w-3" /> Remove file
                </button>
              )}
            </div>
            <textarea
              name="notes"
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Prescription"}
            </button>
          </form>
        )}

        {/* Transfer form */}
        {tab === "transfer" && (
          <form onSubmit={(e) => handleSubmit(e, "transfer")} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Your full name"
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
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              name="currentPharmacy"
              placeholder="Current pharmacy name"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              name="currentPharmacyPhone"
              placeholder="Current pharmacy phone or address"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              name="rxNumber"
              placeholder="Prescription number (if known)"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              name="medications"
              placeholder="Medication names and dosages"
              required
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Request Transfer"}
            </button>
          </form>
        )}

        {/* Refill form */}
        {tab === "refill" && (
          <form onSubmit={(e) => handleSubmit(e, "refill")} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                name="dob"
                placeholder="Date of birth"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              name="rxNumber"
              placeholder="Prescription number"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              name="medications"
              placeholder="Medication name(s) and dosage(s)"
              required
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Preferred pickup method
              </label>
              <div className="flex gap-3">
                {["In-Store Pickup", "Home Delivery"].map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-light"
                  >
                    <input
                      type="radio"
                      name="pickup"
                      value={opt}
                      className="accent-primary"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Request Refill"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
