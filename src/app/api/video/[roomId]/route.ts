import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function canJoinAsStaff(role: string) {
  return ["PHARMACIST", "SUPPORT", "ADMIN"].includes(role);
}

function parseConsultationDateTime(dateStr: string, timeStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  const m = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const ampm = m[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

async function authorize(req: Request, roomId: string) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? undefined;

  const consultation = await prisma.consultation.findFirst({
    where: { videoRoomId: roomId },
  });

  if (!consultation) {
    return { ok: false as const, status: 404, error: "Room not found" };
  }

  const scheduled = parseConsultationDateTime(consultation.date, consultation.time);
  const graceMs = 15 * 60 * 1000;
  if (scheduled) {
    const now = Date.now();
    if (now < scheduled.getTime() - graceMs || now > scheduled.getTime() + graceMs) {
      return { ok: false as const, status: 403, error: "Call is only available around the scheduled time" };
    }
  }

  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = !!session?.user && !!role && canJoinAsStaff(role);

  if (isStaff) {
    return { ok: true as const, kind: "staff" as const, consultation };
  }

  if (!token || !consultation.clientJoinToken || token !== consultation.clientJoinToken) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return { ok: true as const, kind: "client" as const, consultation };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  try {
    const authz = await authorize(req, roomId);
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since") ?? "";
    const sinceId = searchParams.get("sinceId") ?? "";

    const sinceDate = since ? new Date(since) : null;
    const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

    const signals = await prisma.consultationVideoSignal.findMany({
      where: {
        roomId,
        ...(validSince
          ? {
              OR: [
                { createdAt: { gt: validSince } },
                { createdAt: validSince, id: { gt: sinceId || "" } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 200,
    });

    const last = signals.length ? signals[signals.length - 1] : null;

    return NextResponse.json({
      signals,
      nextSince: last ? last.createdAt.toISOString() : validSince?.toISOString() ?? null,
      nextSinceId: last ? last.id : sinceId || null,
      whoami: authz.kind,
      consultationId: authz.consultation.id,
    });
  } catch (err) {
    console.error("[/api/video/:roomId GET]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  try {
    const authz = await authorize(req, roomId);
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const body = await req.json().catch(() => null);
    const kind = body?.kind;
    const payload = body?.payload;

    if (!kind || typeof kind !== "string") {
      return NextResponse.json({ error: "kind required" }, { status: 400 });
    }

    const allowedKinds = ["offer", "answer", "ice", "presence", "hangup"];
    if (!allowedKinds.includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    const sender = authz.kind;

    const created = await prisma.consultationVideoSignal.create({
      data: {
        roomId,
        sender,
        kind,
        payload: payload ?? {},
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[/api/video/:roomId POST]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
