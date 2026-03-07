import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeSiteSettings, readSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const settings = await readSiteSettings();
  return NextResponse.json({
    storyTitle: settings.about?.storyTitle ?? "",
    storyParagraph1: settings.about?.storyParagraph1 ?? "",
    storyParagraph2: settings.about?.storyParagraph2 ?? "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const storyTitle =
      body && typeof body === "object" && "storyTitle" in body
        ? String((body as { storyTitle?: unknown }).storyTitle ?? "")
        : "";
    const storyParagraph1 =
      body && typeof body === "object" && "storyParagraph1" in body
        ? String((body as { storyParagraph1?: unknown }).storyParagraph1 ?? "")
        : "";
    const storyParagraph2 =
      body && typeof body === "object" && "storyParagraph2" in body
        ? String((body as { storyParagraph2?: unknown }).storyParagraph2 ?? "")
        : "";

    await mergeSiteSettings({
      about: {
        storyTitle: storyTitle.trim(),
        storyParagraph1: storyParagraph1.trim(),
        storyParagraph2: storyParagraph2.trim(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
