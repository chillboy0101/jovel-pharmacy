import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

function canManageVideo(role: string) {
  return ["PHARMACIST", "SUPPORT", "ADMIN"].includes(role);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !canManageVideo(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const consultation = await prisma.consultation.findUnique({ where: { id } });
    if (!consultation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (consultation.type !== "video") {
      return NextResponse.json(
        { error: "Video room can only be enabled for video consultations" },
        { status: 400 },
      );
    }

    if (consultation.videoRoomId && consultation.clientJoinToken) {
      return NextResponse.json({
        consultationId: consultation.id,
        roomId: consultation.videoRoomId,
        token: consultation.clientJoinToken,
      });
    }

    const roomId = randomBytes(16).toString("hex");
    const token = randomBytes(24).toString("hex");

    const updated = await prisma.consultation.update({
      where: { id },
      data: { videoRoomId: roomId, clientJoinToken: token },
    });

    return NextResponse.json({
      consultationId: updated.id,
      roomId: updated.videoRoomId,
      token: updated.clientJoinToken,
    });
  } catch (err) {
    console.error("[/api/consultations/:id/video/enable POST]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
