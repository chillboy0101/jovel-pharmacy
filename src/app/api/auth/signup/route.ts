import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { issueAndSendOtp } from "@/lib/otp";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
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
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phone: phone ?? existing.phone,
          otpChannel: otpChannel as never,
        },
        select: { id: true, email: true, name: true, phone: true },
      });

      const issued = await issueAndSendOtp({
        userId: updated.id,
        purpose: "SIGNUP",
        channel: otpChannel,
        email: updated.email,
        phone: updated.phone,
        name: updated.name,
        ttlMinutes: 10,
      });

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
    const user = await prisma.user.create({
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
    });

    const issued = await issueAndSendOtp({
      userId: user.id,
      purpose: "SIGNUP",
      channel: otpChannel,
      email: user.email,
      phone: user.phone,
      name: user.name,
      ttlMinutes: 10,
    });

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
