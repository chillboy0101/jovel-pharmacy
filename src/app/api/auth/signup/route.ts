import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
    const data = signupSchema.parse(body);
    const email = data.email.trim().toLowerCase();

    const existing = (await prismaAny.user.findUnique({
      where: { email },
      select: { id: true },
    })) as null | { id: string };

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(data.password, 12);

    await prismaAny.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone ?? null,
        password: hashed,
        role: "USER",
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/auth/signup POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
