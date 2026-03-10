import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";

const prismaAny = prisma as unknown as typeof prisma & {
  otpToken: {
    create: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
};

export function generateNumericOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const n = crypto.randomInt(min, max + 1);
  return String(n);
}

export function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function maskRecipient(channel: "EMAIL" | "SMS", recipient: string) {
  if (channel === "EMAIL") {
    const [u, d] = recipient.split("@");
    if (!u || !d) return recipient;
    const head = u.slice(0, 2);
    return `${head}${"*".repeat(Math.max(0, u.length - 2))}@${d}`;
  }
  const digits = recipient.replace(/\D+/g, "");
  if (digits.length < 4) return recipient;
  return `***${digits.slice(-4)}`;
}

export async function issueAndSendOtp(args: {
  userId: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
  channel: "EMAIL" | "SMS";
  email: string;
  phone?: string | null;
  name?: string | null;
  ttlMinutes?: number;
}) {
  const ttlMinutes = args.ttlMinutes ?? 10;
  const code = generateNumericOtp(6);
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prismaAny.otpToken.create({
    data: {
      userId: args.userId,
      purpose: args.purpose,
      codeHash,
      expiresAt,
    },
  });

  const message = `Your Jovel Pharmacy verification code is ${code}. It expires in ${ttlMinutes} minutes.`;

  if (args.channel === "SMS") {
    if (!args.phone) return { ok: false, error: "Phone is required for SMS" } as const;
    const ok = await sendSMSNotification(args.phone, message);
    return ok
      ? ({ ok: true, maskedRecipient: maskRecipient("SMS", args.phone) } as const)
      : ({ ok: false, error: "Failed to send SMS" } as const);
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #059669;">Your verification code</h2>
      <p>Hi ${args.name || "there"},</p>
      <p>Your Jovel Pharmacy verification code is:</p>
      <div style="text-align:center; font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 18px 0;">${code}</div>
      <p style="color: #64748b; font-size: 14px;">This code expires in ${ttlMinutes} minutes.</p>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Jovel Pharmacy - Your Community Pharmacy, Where Service Counts</p>
    </div>
  `;

  const ok = await sendEmail({
    to: args.email,
    subject: "Your Jovel Pharmacy verification code",
    html,
  });

  return ok
    ? ({ ok: true, maskedRecipient: maskRecipient("EMAIL", args.email) } as const)
    : ({ ok: false, error: "Failed to send email" } as const);
}

export async function verifyOtp(args: {
  userId: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
  code: string;
}) {
  const now = new Date();
  const codeHash = hashOtp(args.code);

  const token = (await prismaAny.otpToken.findFirst({
    where: {
      userId: args.userId,
      purpose: args.purpose,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  })) as null | { id: string; codeHash: string; attempts: number };

  if (!token) return { ok: false, error: "Invalid or expired code" } as const;

  if (token.attempts >= 5) {
    return { ok: false, error: "Too many attempts. Please request a new code." } as const;
  }

  const matches = crypto.timingSafeEqual(Buffer.from(token.codeHash), Buffer.from(codeHash));

  if (!matches) {
    await prismaAny.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Invalid or expired code" } as const;
  }

  await prismaAny.otpToken.deleteMany({
    where: {
      userId: args.userId,
      purpose: args.purpose,
    },
  });

  return { ok: true } as const;
}
