import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  to: z.string().trim().email(),
});

function isAllowed(req: Request) {
  const token = process.env.TEST_EMAIL_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-test-email-token") === token;
}

export async function POST(req: Request) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }

  const ok = await sendEmail({
    to: parsed.data.to,
    subject: "Jovel Pharmacy - Test Email",
    html: `<div style="font-family: sans-serif">
      <h2>Test email ✅</h2>
      <p>If you received this, your Brevo SMTP setup is working.</p>
    </div>`,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
