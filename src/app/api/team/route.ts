import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/team — public
export async function GET() {
  const members = await prisma.teamMember.findMany({
    orderBy: { order: "asc" },
  });

  // If DB is empty, seed from static data
  if (members.length === 0) {
    const seeds = [
      { name: "Dr. Elena Jovel", role: "Founder & Head Pharmacist", bio: "20+ years in clinical pharmacy. Passionate about patient-centred care and preventive health.", avatar: "EJ", order: 0 },
      { name: "Marcus Thompson", role: "Senior Pharmacist", bio: "Specialist in medication therapy management and chronic disease support.", avatar: "MT", order: 1 },
      { name: "Priya Sharma", role: "Clinical Pharmacist", bio: "Expert in immunizations, health screenings, and wellness consultations.", avatar: "PS", order: 2 },
      { name: "Alex Nguyen", role: "Pharmacy Technician", bio: "Ensures accurate dispensing and seamless prescription management for every patient.", avatar: "AN", order: 3 },
    ];
    await prisma.teamMember.createMany({ data: seeds });
    return NextResponse.json(await prisma.teamMember.findMany({ orderBy: { order: "asc" } }));
  }

  return NextResponse.json(members);
}
