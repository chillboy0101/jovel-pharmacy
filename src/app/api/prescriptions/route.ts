import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const prescriptionSchema = z.object({
  type: z.enum(["upload", "transfer", "refill"]),
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{7,15}$/, "Please enter a valid phone number (7-15 digits)."),
  notes: z.string().trim().max(2000).nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  currentPharmacy: z.string().trim().max(200).nullable().optional(),
  currentPharmacyPhone: z.string().trim().max(200).nullable().optional(),
  rxNumber: z.string().trim().max(200).nullable().optional(),
  medications: z.string().trim().max(2000).nullable().optional(),
  dob: z.string().trim().max(50).nullable().optional(),
  pickup: z.enum(["in_store", "delivery"], { message: "Please select pickup or delivery." }),
});

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
    const data = prescriptionSchema.parse(body);
    const item = await prisma.prescription.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        fileUrl: data.fileUrl ?? null,
        notes: data.notes ?? null,
        currentPharmacy: data.currentPharmacy ?? null,
        currentPharmacyPhone: data.currentPharmacyPhone ?? null,
        rxNumber: data.rxNumber ?? null,
        medications: data.medications ?? null,
        dob: data.dob ?? null,
        pickup: data.pickup,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/prescriptions POST]", err);
    return NextResponse.json({ error: "Failed to submit prescription" }, { status: 500 });
  }
}
