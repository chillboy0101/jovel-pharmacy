import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeSiteSettings, readSiteSettings, type HealthTip } from "@/lib/siteSettings";
import { sendEmail } from "@/lib/email";

function isAdmin(role?: string) {
  return role === "ADMIN";
}

function makeId() {
  return `ht_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await readSiteSettings();
  const tips = Array.isArray(settings.healthTips) ? settings.healthTips : [];
  return NextResponse.json({ tips });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const title =
      body && typeof body === "object" && "title" in body
        ? String((body as { title?: unknown }).title ?? "").trim()
        : "";
    const contentHtml =
      body && typeof body === "object" && "contentHtml" in body
        ? String((body as { contentHtml?: unknown }).contentHtml ?? "").trim()
        : "";

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!contentHtml || contentHtml.length < 20) {
      return NextResponse.json({ error: "Content is too short" }, { status: 400 });
    }

    const settings = await readSiteSettings();
    const tips = Array.isArray(settings.healthTips) ? settings.healthTips : [];

    const tip: HealthTip = {
      id: makeId(),
      title,
      contentHtml,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    await mergeSiteSettings({ healthTips: [tip, ...tips] });

    return NextResponse.json({ tip }, { status: 201 });
  } catch (err) {
    console.error("[/api/admin/health-tips POST]", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const id =
      body && typeof body === "object" && "id" in body
        ? String((body as { id?: unknown }).id ?? "").trim()
        : "";
    const title =
      body && typeof body === "object" && "title" in body
        ? String((body as { title?: unknown }).title ?? "").trim()
        : undefined;
    const contentHtml =
      body && typeof body === "object" && "contentHtml" in body
        ? String((body as { contentHtml?: unknown }).contentHtml ?? "").trim()
        : undefined;
    const action =
      body && typeof body === "object" && "action" in body
        ? String((body as { action?: unknown }).action ?? "").trim()
        : "";

    if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    const settings = await readSiteSettings();
    const tips = Array.isArray(settings.healthTips) ? settings.healthTips : [];
    const idx = tips.findIndex((t) => t.id === id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const current = tips[idx];
    const nextTip: HealthTip = {
      ...current,
      title: typeof title === "string" ? title : current.title,
      contentHtml: typeof contentHtml === "string" ? contentHtml : current.contentHtml,
    };

    const nextTips = tips.slice();
    nextTips[idx] = nextTip;

    // Publish flow: mark published + email blast
    if (action === "publish" && nextTip.status !== "published") {
      nextTip.status = "published";
      nextTip.publishedAt = new Date().toISOString();
      nextTips[idx] = nextTip;

      const subscribers = Array.isArray(settings.newsletterSubscribers)
        ? settings.newsletterSubscribers
        : [];
      const active = subscribers.filter((s) => s.isActive);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const html = `
        <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Jovel Pharmacy</h2>
          <p style="color:#6b7280; text-align:center; margin-top: 6px;">Health Tip</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="margin: 0;">${nextTip.title}</h3>
          <div style="margin-top: 12px; line-height: 1.6; color: #111827;">${nextTip.contentHtml}</div>
          <p style="margin-top: 22px; font-size: 12px; color: #6b7280; text-align:center;">
            Jovel Pharmacy - Your Community Pharmacy, Where Service Counts
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #9ca3af; text-align:center;">
            To stop receiving these emails, reply and request unsubscribe, or visit ${baseUrl}.
          </p>
        </div>
      `;

      const enableSends = (process.env.ENABLE_NEWSLETTER_EMAILS ?? "true").toLowerCase() === "true";
      if (enableSends) {
        for (const s of active) {
          try {
            await sendEmail({
              to: s.email,
              subject: `Health Tip: ${nextTip.title}`,
              html,
            });
          } catch (emailErr) {
            console.error("[health-tips publish] send failed", { email: s.email, emailErr });
          }
        }
      }
    }

    await mergeSiteSettings({ healthTips: nextTips });

    return NextResponse.json({ tip: nextTip });
  } catch (err) {
    console.error("[/api/admin/health-tips PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    const settings = await readSiteSettings();
    const tips = Array.isArray(settings.healthTips) ? settings.healthTips : [];
    const next = tips.filter((t) => t.id !== id);
    await mergeSiteSettings({ healthTips: next });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/health-tips DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
