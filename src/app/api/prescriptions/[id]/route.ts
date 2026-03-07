import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const item = await prisma.prescription.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes ?? undefined,
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[/api/prescriptions PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rx = await prisma.prescription.findUnique({ where: { id } });
    if (!rx) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (rx.fileUrl) {
      try {
        await del(rx.fileUrl);
      } catch (err) {
        console.error("[/api/prescriptions/[id] DELETE] Blob delete failed", err);
        return NextResponse.json(
          { error: "Failed to delete prescription file" },
          { status: 500 },
        );
      }
    }

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/prescriptions/[id] DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
