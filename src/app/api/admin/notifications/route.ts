import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !["ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [prescriptions, consultations] = await Promise.all([
      prisma.prescription.count({ where: { status: "pending" } }),
      prisma.consultation.count({ where: { status: "pending" } }),
    ]);

    return NextResponse.json({ prescriptions, consultations });
  } catch (err) {
    console.error("[/api/admin/notifications GET]", err);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
