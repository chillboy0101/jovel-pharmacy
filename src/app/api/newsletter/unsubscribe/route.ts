import { NextResponse } from "next/server";
import { z } from "zod";
import { mergeSiteSettings, readSiteSettings } from "@/lib/siteSettings";

const unsubscribeSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const data = unsubscribeSchema.parse(body);

    const settings = await readSiteSettings();
    const current = Array.isArray(settings.newsletterSubscribers)
      ? settings.newsletterSubscribers
      : [];

    const email = data.email.toLowerCase();
    const next = current.map((s) =>
      s.email.toLowerCase() === email
        ? { ...s, isActive: false, unsubscribedAt: new Date().toISOString() }
        : s,
    );

    await mergeSiteSettings({ newsletterSubscribers: next });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid email" }, { status: 400 });
    }
    console.error("[/api/newsletter/unsubscribe POST]", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
