import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
] as const;

const consultSchema = z
  .object({
    type: z.enum(["video", "instore", "phone"]),
    duration: z.coerce.number().int(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date."),
    time: z.enum(timeSlots, { message: "Please select a valid time slot." }),
    name: z.string().trim().min(2, "Please enter your full name."),
    email: z.string().trim().email("Please enter a valid email address."),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{7,15}$/, "Please enter a valid phone number (7-15 digits)."),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    const allowedDurations = [15, 30];
    if (!allowedDurations.includes(val.duration)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration"], message: "Invalid duration." });
    }
    if (val.type === "instore" && val.duration !== 15) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration"], message: "In-store consultations are 15 minutes." });
    }
  });

const MIN_LEAD_TIME_MINUTES = 30;

function slotToMinutes(slot: string) {
  const m = slot.trim().match(/^([0-9]{1,2}):([0-9]{2})\s*(AM|PM)$/i);
  if (!m) return Number.NaN;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "AM") {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  return hours * 60 + minutes;
}

// GET /api/consultations — admin only
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !["ADMIN", "PHARMACIST", "SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[/api/consultations GET]", err);
    return NextResponse.json({ error: "Failed to load consultations" }, { status: 500 });
  }
}

// POST /api/consultations — public: book a consultation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = consultSchema.parse(body);

    const todayYmd = new Date().toISOString().split("T")[0];
    if (data.date < todayYmd) {
      return NextResponse.json({ error: "Please select a valid date." }, { status: 400 });
    }

    if (data.date === todayYmd) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const slotMinutes = slotToMinutes(data.time);
      if (Number.isFinite(slotMinutes) && slotMinutes <= nowMinutes + MIN_LEAD_TIME_MINUTES) {
        return NextResponse.json(
          { error: "Please select a time slot that is at least 30 minutes from now." },
          { status: 400 },
        );
      }
    }

    const item = await prisma.consultation.create({
      data: {
        type: data.type,
        duration: data.duration,
        date: data.date,
        time: data.time,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/consultations POST]", err);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
