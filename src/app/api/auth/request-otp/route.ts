import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { issueAndSendOtp } from "@/lib/otp";

const prismaAny = prisma as unknown as typeof prisma & {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

const schema = z.object({
  purpose: z.enum(["SIGNUP", "PASSWORD_RESET"]),
  channel: z.enum(["EMAIL", "SMS"]),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose, channel } = schema.parse(body);

    const user = (await prismaAny.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
      },
    })) as null | {
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      emailVerified: Date | null;
    };

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    if (purpose === "SIGNUP" && user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const issued = await issueAndSendOtp({
      userId: user.id,
      purpose,
      channel,
      email: user.email,
      phone: user.phone,
      name: user.name,
      ttlMinutes: 10,
    });

    if (!issued.ok) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, maskedRecipient: issued.maskedRecipient });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[/api/auth/request-otp POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
