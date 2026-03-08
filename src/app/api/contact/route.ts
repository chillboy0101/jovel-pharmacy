import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name."),
  lastName: z.string().trim().min(1, "Please enter your last name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{7,15}$/, "Please enter a valid phone number (7-15 digits).")
    .optional()
    .or(z.literal("")),
  topic: z.enum(
    [
      "Prescription inquiry",
      "Product question",
      "Delivery issue",
      "Consultation request",
      "General feedback",
      "Other",
    ],
    { message: "Please select a topic." },
  ),
  message: z.string().trim().min(3, "Please enter a message.").max(4000, "Message is too long."),
});

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
    const data = contactSchema.parse(body);

    const newMessage = await prisma.contactMessage.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ? String(data.phone) : null,
        topic: data.topic,
        message: data.message,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/contact POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
