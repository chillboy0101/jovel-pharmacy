import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
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

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const enableAdminEmail = (process.env.ENABLE_ADMIN_EMAILS ?? "true").toLowerCase() === "true";
    const supportEmail = adminEmail || process.env.MAIL_REPLY_TO;

    const customerHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
        <p>Hi ${data.firstName},</p>
        <p>Thanks for reaching out. We've received your message and will get back to you soon.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Topic:</strong> ${data.topic}</p>
          <p style="margin: 8px 0 0 0;"><strong>Your message:</strong><br />${data.message.replace(/\n/g, "<br />")}</p>
        </div>
        ${supportEmail ? `<p style="color: #6b7280;">If you need to add more details, reply to this email.</p>` : ""}
      </div>
    `;

    try {
      await sendEmail({
        to: data.email,
        subject: "We received your message - Jovel Pharmacy",
        html: customerHtml,
      });

      if (enableAdminEmail && adminEmail) {
        const adminHtml = `
          <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">New Contact Message</h2>
            <p><strong>From:</strong> ${data.firstName} ${data.lastName} (${data.email})</p>
            <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
            <p><strong>Topic:</strong> ${data.topic}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="white-space: pre-wrap;">${data.message}</p>
            <p style="color: #6b7280;"><strong>Message ID:</strong> ${newMessage.id}</p>
          </div>
        `;
        await sendEmail({
          to: adminEmail,
          subject: `New contact message: ${data.topic}`,
          html: adminHtml,
        });
      }
    } catch (emailErr) {
      console.error("[/api/contact POST] Email send failed:", emailErr);
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/contact POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
