import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/consultations — admin only
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !["ADMIN", "PHARMACIST", "SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[/api/consultations GET]", err);
    return NextResponse.json({ error: "Failed to load consultations" }, { status: 500 });
  }
}

// POST /api/consultations — public: book a consultation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, duration, date, time, name, email, phone, notes } = body;
    if (!type || !duration || !date || !time || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const item = await prisma.consultation.create({
      data: { type, duration: Number(duration), date, time, name, email, phone, notes: notes || null },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[/api/consultations POST]", err);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
