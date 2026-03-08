import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
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

type DayHours = { openMin: number; closeMin: number } | null;

const WORKING_HOURS_BY_DAY: Record<number, DayHours> = {
  0: null,
  1: { openMin: 9 * 60, closeMin: 17 * 60 },
  2: { openMin: 9 * 60, closeMin: 17 * 60 },
  3: { openMin: 9 * 60, closeMin: 17 * 60 },
  4: { openMin: 9 * 60, closeMin: 17 * 60 },
  5: { openMin: 9 * 60, closeMin: 17 * 60 },
  6: { openMin: 9 * 60, closeMin: 17 * 60 },
};

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

    const bookingDay = new Date(`${data.date}T00:00:00Z`);
    const dayHours = WORKING_HOURS_BY_DAY[bookingDay.getUTCDay()] ?? null;
    if (!dayHours) {
      return NextResponse.json(
        { error: "We’re closed on the selected day. Please choose another date." },
        { status: 400 },
      );
    }

    const slotMinutes = slotToMinutes(data.time);
    if (
      Number.isFinite(slotMinutes) &&
      (slotMinutes < dayHours.openMin || slotMinutes >= dayHours.closeMin)
    ) {
      return NextResponse.json(
        { error: "Selected time is outside of our working hours. Please choose another time." },
        { status: 400 },
      );
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

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const enableAdminEmail = (process.env.ENABLE_ADMIN_EMAILS ?? "true").toLowerCase() === "true";

    const typeLabel = data.type === "instore" ? "In-store" : data.type === "video" ? "Video" : "Phone";
    const customerHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
        <p>Hi ${data.name.split(" ")[0] || "there"},</p>
        <p>Your consultation request has been received. We'll confirm if anything changes.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Type:</strong> ${typeLabel}</p>
          <p style="margin: 8px 0 0 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
          <p style="margin: 8px 0 0 0;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${data.time}</p>
        </div>
        <p style="color: #6b7280;">If you need to update your details, reply to this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: data.email,
        subject: "Consultation request received - Jovel Pharmacy",
        html: customerHtml,
      });

      if (enableAdminEmail && adminEmail) {
        const adminHtml = `
          <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">New Consultation Booking</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Type:</strong> ${typeLabel}</p>
            <p><strong>Duration:</strong> ${data.duration} minutes</p>
            <p><strong>Date/Time:</strong> ${data.date} @ ${data.time}</p>
            <p><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</p>
            <p style="color: #6b7280;"><strong>Consultation ID:</strong> ${item.id}</p>
          </div>
        `;
        await sendEmail({
          to: adminEmail,
          subject: `New consultation: ${typeLabel} on ${data.date} ${data.time}`,
          html: adminHtml,
        });
      }
    } catch (emailErr) {
      console.error("[/api/consultations POST] Email send failed:", emailErr);
    }

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/consultations POST]", err);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
