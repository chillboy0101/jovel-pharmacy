import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const prismaAny = prisma as unknown as typeof prisma & {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

function normalizePhone(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? `+233${digits.slice(1)}` : `+${digits}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = (await prismaAny.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        otpChannel: true,
      },
    })) as null | {
      id: string;
      email: string;
      phone: string | null;
      otpChannel: "EMAIL" | "SMS";
    };

    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      phone: user?.phone ?? null,
      otpChannel: user?.otpChannel ?? "EMAIL",
    });
  } catch (err) {
    console.error("[/api/account/profile GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { phone?: unknown };
    const phoneRaw = typeof body.phone === "string" ? body.phone : "";
    const phone = normalizePhone(phoneRaw);

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const updated = (await prismaAny.user.update({
      where: { id: session.user.id },
      data: {
        phone,
        phoneVerified: null,
      },
      select: { phone: true },
    })) as { phone: string | null };

    return NextResponse.json({ ok: true, phone: updated.phone });
  } catch (err) {
    const message =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : "";

    if (message === "P2002") {
      return NextResponse.json(
        { error: "That phone number is already used by another account." },
        { status: 409 },
      );
    }

    console.error("[/api/account/profile PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
