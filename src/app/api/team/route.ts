import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEEDS = [
  { name: "Dr. Elena Jovel", role: "Founder & Head Pharmacist", bio: "20+ years in clinical pharmacy. Passionate about patient-centred care and preventive health.", avatar: "EJ", order: 0 },
  { name: "Marcus Thompson", role: "Senior Pharmacist", bio: "Specialist in medication therapy management and chronic disease support.", avatar: "MT", order: 1 },
  { name: "Priya Sharma", role: "Clinical Pharmacist", bio: "Expert in immunizations, health screenings, and wellness consultations.", avatar: "PS", order: 2 },
  { name: "Alex Nguyen", role: "Pharmacy Technician", bio: "Ensures accurate dispensing and seamless prescription management for every patient.", avatar: "AN", order: 3 },
];

// GET /api/team — public
export async function GET() {
  try {
    let members = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });

    if (members.length === 0) {
      await prisma.teamMember.createMany({ data: SEEDS });
      members = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
    }

    return NextResponse.json(members);
  } catch (err) {
    console.error("[/api/team GET]", err);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}
