import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const prismaAny = prisma as unknown as typeof prisma & {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

const schema = z.object({
  purpose: z.enum(["SIGNUP", "PASSWORD_RESET"]),
  email: z.string().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose, code } = schema.parse(body);

    const user = (await prismaAny.user.findUnique({
      where: { email },
      select: { id: true },
    })) as null | { id: string };

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const result = await verifyOtp({ userId: user.id, purpose, code });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (purpose === "SIGNUP") {
      const now = new Date();
      await prismaAny.user.update({
        where: { id: user.id },
        data: {
          emailVerified: now,
          verifyToken: null,
          verifyTokenExpiry: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/auth/verify-otp POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
