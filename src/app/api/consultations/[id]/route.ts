import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const MEETING_LINK_PREFIX = "MEETING_LINK:";
const CONFIRMED_EMAIL_SENT_PREFIX = "CONFIRMED_EMAIL_SENT:";

function getMeetingLink(notes: string | null | undefined) {
  if (!notes) return "";
  const line = notes
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toUpperCase().startsWith(MEETING_LINK_PREFIX));
  if (!line) return "";
  return line.slice(MEETING_LINK_PREFIX.length).trim();
}

function hasConfirmedEmailSent(notes: string | null | undefined) {
  if (!notes) return false;
  return notes
    .split("\n")
    .map((l) => l.trim())
    .some((l) => l.toUpperCase().startsWith(CONFIRMED_EMAIL_SENT_PREFIX));
}

function addConfirmedEmailSent(notes: string | null | undefined) {
  const existing = (notes ?? "").trim();
  const stamp = `${CONFIRMED_EMAIL_SENT_PREFIX} ${new Date().toISOString()}`;
  if (!existing) return stamp;
  return `${stamp}\n${existing}`;
}

function getClientVideoLink(consultationId: string, token?: string | null) {
  if (!token) return "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/consult/video/${consultationId}#token=${encodeURIComponent(token)}`;
}

async function maybeSendConfirmedEmail(consultation: {
  id: string;
  type: string;
  status: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  adminNotes: string | null;
  clientJoinToken: string | null;
}) {
  if (consultation.status !== "confirmed") return null;
  if (consultation.type !== "video") return null;
  if (hasConfirmedEmailSent(consultation.adminNotes)) return null;

  const meetingLink = getMeetingLink(consultation.adminNotes);
  const inAppLink = getClientVideoLink(consultation.id, consultation.clientJoinToken);
  const joinLink = meetingLink || inAppLink;
  if (!joinLink) return null;

  const firstName = consultation.name.split(" ")[0] || "there";
  const html = `
    <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p>Hi ${firstName},</p>
      <p>Your consultation has been confirmed.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 18px 0;">
        <p style="margin: 0;"><strong>Schedule:</strong> ${consultation.date} @ ${consultation.time} (${consultation.duration} minutes)</p>
      </div>
      <p style="margin: 14px 0 6px 0;"><strong>Join link:</strong></p>
      <p style="margin: 0 0 18px 0;">
        <a href="${joinLink}" style="background: #10b981; color: white; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Start Video Call
        </a>
      </p>
      <p style="color: #6b7280; font-size: 12px;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="font-family: monospace; font-size: 12px; word-break: break-all; background: #fff; border: 1px solid #eee; padding: 10px; border-radius: 8px;">${joinLink}</p>
      <p style="margin-top: 22px; text-align: center; color: #9ca3af; font-size: 12px;">
        Jovel Pharmacy - Your Community Pharmacy, Where Service Counts
      </p>
    </div>
  `;

  const ok = await sendEmail({
    to: consultation.email,
    subject: "Your consultation is confirmed — join link",
    html,
  });

  return ok;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || !["ADMIN", "PHARMACIST", "SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();

    const existing = await prisma.consultation.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        status: true,
        date: true,
        time: true,
        duration: true,
        name: true,
        email: true,
        adminNotes: true,
        clientJoinToken: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.consultation.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes ?? undefined,
      },
    });

    try {
      const after = await prisma.consultation.findUnique({
        where: { id },
        select: {
          id: true,
          type: true,
          status: true,
          date: true,
          time: true,
          duration: true,
          name: true,
          email: true,
          adminNotes: true,
          clientJoinToken: true,
        },
      });

      if (after && existing.status !== "confirmed" && after.status === "confirmed") {
        const sent = await maybeSendConfirmedEmail(after);
        if (sent) {
          await prisma.consultation.update({
            where: { id },
            data: {
              adminNotes: addConfirmedEmailSent(after.adminNotes),
            },
          });
        }
      }
    } catch (notifyErr) {
      console.error("[consultations confirm email]", notifyErr);
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error("[/api/consultations PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
