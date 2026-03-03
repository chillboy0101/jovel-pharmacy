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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Full name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="tel"
                placeholder="Phone number"
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
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Submit Prescription
            </button>
          </form>
        )}

        {/* Transfer form */}
        {tab === "transfer" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your full name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="tel"
                placeholder="Phone number"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              type="text"
              placeholder="Current pharmacy name"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Current pharmacy phone or address"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Prescription number (if known)"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              placeholder="Medication names and dosages"
              required
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Request Transfer
            </button>
          </form>
        )}

        {/* Refill form */}
        {tab === "refill" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your full name"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Date of birth"
                required
                className="rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              type="text"
              placeholder="Prescription number"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
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
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Request Refill
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
