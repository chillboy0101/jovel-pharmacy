import { Resend } from 'resend';
import nodemailer, { type Transporter } from "nodemailer";
import { buildReceiptEmailHtml, type ReceiptTemplateOrder } from "@/lib/receiptTemplate";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let smtpTransporterPromise: Promise<Transporter> | null = null;

async function getSmtpTransporter() {
  if (smtpTransporterPromise) return smtpTransporterPromise;

  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT ?? "587");
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  if (!host || !user || !pass) return null;

  smtpTransporterPromise = (async () => {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  })();

  return smtpTransporterPromise;
}

export type NotificationType = 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED';

type ReceiptEmailItem = {
  quantity: number;
  price: number;
  product: {
    name: string;
    emoji: string;
    imageUrl?: string | null;
  };
};

type ReceiptEmailOrder = {
  id: string;
  firstName?: string | null;
  email: string;
  status: string;
  createdAt: string | Date;
  shipping: number;
  total: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  items: ReceiptEmailItem[];
};

export async function sendReceiptEmail(order: ReceiptEmailOrder, type: NotificationType = 'ORDER_DELIVERED') {
  const subjects: Record<NotificationType, string> = {
    ORDER_CONFIRMED: `Order Confirmed - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_SHIPPED: `Your Order is on its way! - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_DELIVERED: `Order Delivered - #${order.id.slice(0, 8).toUpperCase()}`,
    ORDER_CANCELLED: `Order Cancelled - #${order.id.slice(0, 8).toUpperCase()}`,
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const receiptOrder: ReceiptTemplateOrder = {
    id: order.id,
    firstName: order.firstName,
    status: order.status,
    createdAt: order.createdAt,
    shipping: order.shipping,
    total: order.total,
    address: order.address,
    city: order.city,
    state: order.state,
    zip: order.zip,
    country: order.country,
    items: order.items,
  };

  const html = buildReceiptEmailHtml({
    order: receiptOrder,
    type,
    baseUrl,
  });

  return sendEmail({
    to: order.email,
    subject: subjects[type],
    html
  });
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const smtpTransporter = await getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: process.env.MAIL_FROM || "Jovel Pharmacy <noreply@jovelpharmacy.com>",
        replyTo: process.env.MAIL_REPLY_TO || undefined,
        to,
        subject,
        html,
      });
      console.log("[sendEmail] SMTP accepted:", {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        pending: (info as unknown as { pending?: string[] }).pending,
      });
      return true;
    } catch (err) {
      console.error("[sendEmail] SMTP error:", err);
      return false;
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Jovel Pharmacy <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[sendEmail] Resend error:", err);
      return false;
    }
  }

  if (process.env.NODE_ENV === "production") return false;

  console.log(`--- MOCK EMAIL ---`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("------------------");
  return true;
}
