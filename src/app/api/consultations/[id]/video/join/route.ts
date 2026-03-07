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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const consultation = await prisma.consultation.findUnique({ where: { id } });
    if (!consultation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (consultation.type !== "video") {
      return NextResponse.json({ error: "Not a video consultation" }, { status: 400 });
    }

    const scheduled = parseConsultationDateTime(consultation.date, consultation.time);
    const graceMs = 15 * 60 * 1000;
    if (scheduled) {
      const now = Date.now();
      if (now < scheduled.getTime() - graceMs || now > scheduled.getTime() + graceMs) {
        return NextResponse.json(
          { error: "Call is only available around the scheduled time" },
          { status: 403 },
        );
      }
    }

    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (session?.user && role && canJoinAsStaff(role)) {
      if (!consultation.videoRoomId || !consultation.clientJoinToken) {
        return NextResponse.json(
          { error: "Video room not enabled yet" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        roomId: consultation.videoRoomId,
        consultationId: consultation.id,
        whoami: "staff",
      });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";

    if (!token || !consultation.clientJoinToken || token !== consultation.clientJoinToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!consultation.videoRoomId) {
      return NextResponse.json(
        { error: "Video room not enabled yet" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      roomId: consultation.videoRoomId,
      consultationId: consultation.id,
      whoami: "client",
    });
  } catch (err) {
    console.error("[/api/consultations/:id/video/join GET]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
