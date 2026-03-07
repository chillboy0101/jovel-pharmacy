import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeSiteSettings, readSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const settings = await readSiteSettings();
  return NextResponse.json({
    momoMerchantId: settings.momoMerchantId ?? "",
    momoMerchantName: settings.momoMerchantName ?? "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const momoMerchantId =
      body && typeof body === "object" && "momoMerchantId" in body
        ? String((body as { momoMerchantId?: unknown }).momoMerchantId ?? "")
        : "";

    const momoMerchantName =
      body && typeof body === "object" && "momoMerchantName" in body
        ? String((body as { momoMerchantName?: unknown }).momoMerchantName ?? "")
        : "";

    await mergeSiteSettings({
      momoMerchantId: momoMerchantId.trim(),
      momoMerchantName: momoMerchantName.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
