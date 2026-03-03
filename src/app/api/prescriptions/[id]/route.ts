import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
