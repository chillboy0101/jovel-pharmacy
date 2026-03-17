import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, isAdminRole } from "@/lib/auth";

const SEEDS = [
  { name: "Victoria Oluwakemi Akai Quartey", email: "admin@jovelpharmacy.com", role: "Administrator", bio: "", avatar: "VQ", order: 0, systemRole: "ADMIN" },
  { name: "Staff", email: "staff@jovelpharmacy.com", role: "Staff", bio: "", avatar: "ST", order: 1, systemRole: "STAFF" },
];

function systemRoleToUserRole(systemRole: unknown) {
  const v = String(systemRole || "USER").toUpperCase();
  return v === "ADMIN" ? "ADMIN" : v === "STAFF" ? "STAFF" : "USER";
}

function isPrismaConnectionError(err: unknown) {
  const anyErr = err as { code?: string; message?: string } | null;
  const code = anyErr?.code;
  if (code === "P1001" || code === "P2024") return true;
  const msg = anyErr?.message ?? "";
  return msg.includes("Can't reach database server") || msg.includes("connection pool");
}

// GET /api/team — public
export async function GET() {
  try {
    let members = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });

    if (members.length === 0) {
      await prisma.teamMember.createMany({ data: SEEDS });
      members = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
    }

    // Backfill userId links for members that have an email.
    const toLink = members.filter((m) => m.email && !m.userId);
    for (const m of toLink) {
      const email = String(m.email).toLowerCase();
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (u) {
        await prisma.teamMember.update({ where: { id: m.id }, data: { userId: u.id } });
      }
    }

    return NextResponse.json(members);
  } catch (err) {
    console.error("[/api/team GET]", err);
    if (isPrismaConnectionError(err)) {
      return NextResponse.json(
        SEEDS.map((m) => ({
          id: `seed-${m.order}`,
          imageUrl: null,
          ...m,
        })),
      );
    }
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

    const emailRaw = String(body.email || "").trim().toLowerCase();
    if (!emailRaw) {
      return NextResponse.json({ error: "Email is required to link a team member to a user." }, { status: 400 });
    }

    const linkedUser = await prisma.user.findUnique({
      where: { email: emailRaw },
      select: { id: true },
    });

    if (!linkedUser) {
      return NextResponse.json(
        { error: "No user found for this email. Create the user first in Admin → Users, then add them to the team." },
        { status: 400 },
      );
    }

    // Create the team member record
    const member = await prisma.teamMember.create({
      data: {
        name: body.name ?? "New Member",
        role: body.role ?? "Role",
        bio: body.bio ?? "",
        avatar: body.avatar ?? "NM",
        systemRole: body.systemRole ?? "USER",
        email: emailRaw,
        userId: linkedUser.id,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    await prisma.user.update({
      where: { id: linkedUser.id },
      data: { role: systemRoleToUserRole(body.systemRole) },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("[/api/team POST]", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
