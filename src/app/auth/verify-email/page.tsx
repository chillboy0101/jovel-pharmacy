"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus({ type: "error", text: "Invalid or missing verification token." });
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });
        const data = await res.json();

        if (res.ok) {
          setStatus({ type: "success", text: "Email verified successfully! You can now sign in." });
        } else {
          setStatus({ type: "error", text: data.error || "Verification failed." });
        }
      } catch {
        setStatus({ type: "error", text: "Verification failed. Please try again." });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className={`rounded-xl p-4 flex items-start gap-3 ${
      status.type === "success"
        ? "bg-green-50 text-green-700 border border-green-100"
        : "bg-red-50 text-red-700 border border-red-100"
    }`}>
      {status.type === "success" ? (
        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium">{status.text}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <Logo className="mb-6" />
          <h2 className="text-2xl font-bold text-foreground">Verify Email</h2>
          <p className="mt-2 text-sm text-muted">We’re confirming your email address.</p>
        </div>

        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <VerifyEmailContent />
        </Suspense>

        <div className="text-center mt-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
