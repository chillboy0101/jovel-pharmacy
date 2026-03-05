import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security reasons, don't reveal if the user exists
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost ?? req.headers.get("host");
    const proto = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");
    const baseUrl = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? "");
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your Jovel Pharmacy password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #059669;">Password Reset Request</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset your password for your Jovel Pharmacy account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Jovel Pharmacy - Premium Healthcare Services</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    console.error("[/api/auth/forgot-password POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
