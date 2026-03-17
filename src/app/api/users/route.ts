import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  password: z.string().min(6),
<<<<<<< HEAD
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
=======
  role: z.enum(["USER", "STAFF", "ADMIN"]).default("USER"),
>>>>>>> bf33c9d (mar 17)
});

// GET /api/users — admin: get all user accounts
export async function GET() {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "ADMIN") {
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

<<<<<<< HEAD
// POST /api/users — admin: create a staff/admin account
=======
// POST /api/users — admin: create a user account
>>>>>>> bf33c9d (mar 17)
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const created = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email,
        password: hashed,
        role: data.role,
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    console.error("[/api/users POST]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
