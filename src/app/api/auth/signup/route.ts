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
  try {
    const body = await req.json();
    const { name, email, phone, password, otpChannel } = signupSchema.parse(body);

    if (otpChannel === "SMS" && !phone) {
      return NextResponse.json({ error: "Phone is required for SMS verification" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        password: hashed,
        emailVerified: new Date(), // Automatically verify email for simplicity
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      select: { id: true, email: true, name: true, phone: true },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      verificationRequired: false,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
