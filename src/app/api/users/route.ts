import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/users — admin: get all user accounts
export async function GET() {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[/api/users GET]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
