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

    const existing = (await prismaAny.user.findUnique({ where: { email } })) as
      | null
      | { id: string; emailVerified: Date | null; phone?: string | null; name?: string | null };
    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
      }

      const updated = (await prismaAny.user.update({
        where: { id: existing.id },
        data: {
          phone: phone ?? (existing.phone ?? null),
          otpChannel: otpChannel as never,
        },
        select: { id: true, email: true, name: true, phone: true },
      })) as { id: string; email: string; name: string | null; phone: string | null };

      const issued = await issueAndSendOtp({
        userId: updated.id,
        purpose: "SIGNUP",
        channel: otpChannel,
        email: updated.email,
        phone: updated.phone,
        name: updated.name,
        ttlMinutes: 10,
      });

      if (otpChannel === "SMS" && !issued.ok) {
        return NextResponse.json(
          { error: issued.error || "Failed to send SMS" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        verificationRequired: true,
        otpChannel,
        maskedRecipient: issued.ok ? issued.maskedRecipient : undefined,
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = (await prismaAny.user.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        password: hashed,
        emailVerified: null,
        otpChannel: otpChannel as never,
        verifyToken: crypto.randomBytes(32).toString("hex"),
        verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: { id: true, email: true, name: true, phone: true },
    })) as { id: string; email: string; name: string | null; phone: string | null };

    const issued = await issueAndSendOtp({
      userId: user.id,
      purpose: "SIGNUP",
      channel: otpChannel,
      email: user.email,
      phone: user.phone,
      name: user.name,
      ttlMinutes: 10,
    });

    if (otpChannel === "SMS" && !issued.ok) {
      return NextResponse.json(
        { error: issued.error || "Failed to send SMS" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      verificationRequired: true,
      otpChannel,
      maskedRecipient: issued.ok ? issued.maskedRecipient : undefined,
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
