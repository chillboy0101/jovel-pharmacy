import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const prescriptionSchema = z.object({
  type: z.enum(["upload", "transfer", "refill"]),
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{7,15}$/, "Please enter a valid phone number (7-15 digits)."),
  notes: z.string().trim().max(2000).nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  currentPharmacy: z.string().trim().max(200).nullable().optional(),
  currentPharmacyPhone: z.string().trim().max(200).nullable().optional(),
  rxNumber: z.string().trim().max(200).nullable().optional(),
  medications: z.string().trim().max(2000).nullable().optional(),
  dob: z.string().trim().max(50).nullable().optional(),
  pickup: z.enum(["in_store", "delivery"], { message: "Please select pickup or delivery." }),
});

// GET /api/prescriptions — admin only
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !["ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await prisma.prescription.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[/api/prescriptions GET]", err);
    return NextResponse.json({ error: "Failed to load prescriptions" }, { status: 500 });
  }
}

// POST /api/prescriptions — public
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = prescriptionSchema.parse(body);
    const item = await prisma.prescription.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        fileUrl: data.fileUrl ?? null,
        notes: data.notes ?? null,
        currentPharmacy: data.currentPharmacy ?? null,
        currentPharmacyPhone: data.currentPharmacyPhone ?? null,
        rxNumber: data.rxNumber ?? null,
        medications: data.medications ?? null,
        dob: data.dob ?? null,
        pickup: data.pickup,
      },
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const enableAdminEmail = (process.env.ENABLE_ADMIN_EMAILS ?? "true").toLowerCase() === "true";

    const typeLabel = data.type === "upload" ? "Upload" : data.type === "transfer" ? "Transfer" : "Refill";
    const pickupLabel = data.pickup === "in_store" ? "In-store pickup" : "Home delivery";

    const customerHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
        <p>Hi ${data.name.split(" ")[0] || "there"},</p>
        <p>We’ve received your prescription request. Our pharmacy team will review it and contact you shortly.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Request type:</strong> ${typeLabel}</p>
          <p style="margin: 8px 0 0 0;"><strong>Pickup method:</strong> ${pickupLabel}</p>
          ${data.rxNumber ? `<p style="margin: 8px 0 0 0;"><strong>Rx number:</strong> ${data.rxNumber}</p>` : ""}
          ${data.currentPharmacy ? `<p style="margin: 8px 0 0 0;"><strong>Current pharmacy:</strong> ${data.currentPharmacy}</p>` : ""}
        </div>
        <p style="color: #6b7280;">If you need to add more info, reply to this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: data.email,
        subject: "Prescription request received - Jovel Pharmacy",
        html: customerHtml,
      });

      if (enableAdminEmail && adminEmail) {
        const adminHtml = `
          <div style="font-family: sans-serif; max-width: 750px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">New Prescription Request</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Type:</strong> ${typeLabel}</p>
            <p><strong>Pickup:</strong> ${pickupLabel}</p>
            ${data.dob ? `<p><strong>DOB:</strong> ${data.dob}</p>` : ""}
            ${data.rxNumber ? `<p><strong>Rx number:</strong> ${data.rxNumber}</p>` : ""}
            ${data.currentPharmacy ? `<p><strong>Current pharmacy:</strong> ${data.currentPharmacy}</p>` : ""}
            ${data.currentPharmacyPhone ? `<p><strong>Current pharmacy phone:</strong> ${data.currentPharmacyPhone}</p>` : ""}
            ${data.medications ? `<p><strong>Medications:</strong><br />${data.medications.replace(/\n/g, "<br />")}</p>` : ""}
            ${data.notes ? `<p><strong>Notes:</strong><br />${data.notes.replace(/\n/g, "<br />")}</p>` : ""}
            ${data.fileUrl ? `<p><strong>File:</strong> <a href="${data.fileUrl}">${data.fileUrl}</a></p>` : ""}
            <p style="color: #6b7280;"><strong>Prescription ID:</strong> ${item.id}</p>
          </div>
        `;
        await sendEmail({
          to: adminEmail,
          subject: `New prescription: ${typeLabel} (${pickupLabel})`,
          html: adminHtml,
        });
      }
    } catch (emailErr) {
      console.error("[/api/prescriptions POST] Email send failed:", emailErr);
    }

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[/api/prescriptions POST]", err);
    return NextResponse.json({ error: "Failed to submit prescription" }, { status: 500 });
  }
}
