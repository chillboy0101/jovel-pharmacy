"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!token) {
    return (
      <div className="rounded-xl bg-red-50 p-4 flex items-start gap-3 border border-red-100 text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">Invalid or missing reset token. Please request a new link.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", text: "Password reset successfully! Redirecting to sign in..." });
        setTimeout(() => router.push("/account"), 3000);
      } else {
        setStatus({ type: "error", text: data.error || "Failed to reset password." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {status && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        }`}>
          {status.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{status.text}</p>
        </div>
      )}

      {status?.type !== "success" && (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Logo className="h-12 w-12 mx-auto" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-foreground">Set New Password</h2>
          <p className="mt-2 text-sm text-muted">
            Almost there! Please choose a strong new password.
          </p>
        </div>

        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <ResetPasswordForm />
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
