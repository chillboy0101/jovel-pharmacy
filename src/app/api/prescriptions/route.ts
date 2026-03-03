import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/prescriptions — admin only
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await prisma.prescription.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[/api/prescriptions GET]", err);
    return NextResponse.json({ error: "Failed to load prescriptions" }, { status: 500 });
  }
}

// POST /api/prescriptions — public
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, name, email, phone } = body;
    if (!type || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const item = await prisma.prescription.create({
      data: {
        type,
        name,
        email,
        phone,
        fileUrl: body.fileUrl || null,
        notes: body.notes || null,
        currentPharmacy: body.currentPharmacy || null,
        currentPharmacyPhone: body.currentPharmacyPhone || null,
        rxNumber: body.rxNumber || null,
        medications: body.medications || null,
        dob: body.dob || null,
        pickup: body.pickup || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[/api/prescriptions POST]", err);
    return NextResponse.json({ error: "Failed to submit prescription" }, { status: 500 });
  }
}
