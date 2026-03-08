import { NextResponse } from "next/server";
import { z } from "zod";
import { mergeSiteSettings, readSiteSettings, type NewsletterSubscriber } from "@/lib/siteSettings";

const subscribeSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const data = subscribeSchema.parse(body);

    const settings = await readSiteSettings();
    const current = Array.isArray(settings.newsletterSubscribers)
      ? settings.newsletterSubscribers
      : [];

    const email = data.email.toLowerCase();
    const existing = current.find((s) => s.email.toLowerCase() === email);

    let next: NewsletterSubscriber[];
    if (existing) {
      next = current.map((s) =>
        s.email.toLowerCase() === email
          ? { ...s, isActive: true, unsubscribedAt: undefined }
          : s,
      );
    } else {
      next = [
        ...current,
        {
          email,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    await mergeSiteSettings({ newsletterSubscribers: next });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid email" }, { status: 400 });
    }
    console.error("[/api/newsletter/subscribe POST]", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
