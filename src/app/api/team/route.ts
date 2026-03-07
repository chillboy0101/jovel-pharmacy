import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, isAdminRole } from "@/lib/auth";

const SEEDS = [
  { name: "Victoria Oluwakemi Akai Quartey", email: "admin@jovelpharmacy.com", role: "Administrator", bio: "", avatar: "VQ", order: 0, systemRole: "ADMIN" },
  { name: "Staff", email: "staff@jovelpharmacy.com", role: "Staff", bio: "", avatar: "ST", order: 1, systemRole: "SUPPORT" },
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

// POST /api/team — admin only: create new team member
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const maxOrder = await prisma.teamMember.aggregate({ _max: { order: true } });
    
    // Create the team member record
    const member = await prisma.teamMember.create({
      data: {
        name: body.name ?? "New Member",
        role: body.role ?? "Role",
        bio: body.bio ?? "",
        avatar: body.avatar ?? "NM",
        systemRole: body.systemRole ?? "USER",
        email: body.email, // Optional: if we want to link by email later
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    // If an email is provided, try to find the user and update their role
    if (body.email && body.systemRole && body.systemRole !== "USER") {
      await prisma.user.updateMany({
        where: { email: body.email },
        data: { role: body.systemRole }
      });
    }

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("[/api/team POST]", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
