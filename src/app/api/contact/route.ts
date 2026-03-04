import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/contact — admin only
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages);
  } catch (err) {
    console.error("[/api/contact GET]", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/contact — public
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, message } = body;
    
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = await prisma.contactMessage.create({
      data: {
        firstName,
        lastName,
        email,
        phone: body.phone || null,
        topic: body.topic || null,
        message,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err) {
    console.error("[/api/contact POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
