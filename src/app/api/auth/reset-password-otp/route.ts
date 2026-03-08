import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits"),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, password } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const verified = await verifyOtp({
      userId: user.id,
      purpose: "PASSWORD_RESET",
      code,
    });

    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/auth/reset-password-otp POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
