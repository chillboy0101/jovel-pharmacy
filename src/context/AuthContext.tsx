"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    phone: string,
    password: string,
    otpChannel: "EMAIL" | "SMS",
  ) => Promise<{
    ok: boolean;
    error?: string;
    verificationRequired?: boolean;
    maskedRecipient?: string;
  }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "USER",
      }
    : null;

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return result?.error ? { ok: false, error: result.error } : { ok: true };
  };

  const signup = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    otpChannel: "EMAIL" | "SMS",
  ) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone: phone || undefined, password, otpChannel }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: data?.error || "Sign-up failed" };
    }
    const data = (await res.json().catch(() => null)) as
      | null
      | { verificationRequired?: boolean; maskedRecipient?: string };
    return {
      ok: true,
      verificationRequired: !!data?.verificationRequired,
      maskedRecipient: data?.maskedRecipient,
    };
  };

  const logout = () => {
    signOut({ redirect: false });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
