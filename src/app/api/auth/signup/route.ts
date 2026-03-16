import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { issueAndSendOtp } from "@/lib/otp";

const prismaAny = prisma as unknown as typeof prisma & {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
};

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{7,15}$/, "Phone number must contain only digits")
  .optional();

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: phoneSchema,
  password: z.string().min(6),
  otpChannel: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
});

export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Sign-up is disabled." },
    { status: 403 },
  );
}
