import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeSiteSettings, readSiteSettings, type DeliveryZone } from "@/lib/siteSettings";

function seedZones(): DeliveryZone[] {
  return [
    { id: "accra", label: "Accra", region: "Greater Accra", rate: 15, enabled: true },
    { id: "tema", label: "Tema", region: "Greater Accra", rate: 18, enabled: true },
    { id: "kumasi", label: "Kumasi", region: "Ashanti", rate: 35, enabled: true },
    { id: "tamale", label: "Tamale", region: "Northern", rate: 45, enabled: true },
    { id: "sekondi-takoradi", label: "Sekondi-Takoradi", region: "Western", rate: 40, enabled: true },
    { id: "cape-coast", label: "Cape Coast", region: "Central", rate: 30, enabled: true },
    { id: "sunyani", label: "Sunyani", region: "Bono", rate: 40, enabled: true },
    { id: "ho", label: "Ho", region: "Volta", rate: 35, enabled: true },
    { id: "koforidua", label: "Koforidua", region: "Eastern", rate: 25, enabled: true },
    { id: "bolgatanga", label: "Bolgatanga", region: "Upper East", rate: 55, enabled: true },
    { id: "wa", label: "Wa", region: "Upper West", rate: 55, enabled: true },
  ];
}

export async function GET() {
  const settings = await readSiteSettings();
  const zones = Array.isArray(settings.deliveryZones) && settings.deliveryZones.length > 0
    ? settings.deliveryZones
    : seedZones();

  return NextResponse.json({ zones });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const zonesRaw =
      body && typeof body === "object" && "zones" in body
        ? (body as { zones?: unknown }).zones
        : [];

    if (!Array.isArray(zonesRaw)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const zones: DeliveryZone[] = zonesRaw
      .filter((z): z is Record<string, unknown> => !!z && typeof z === "object")
      .map((z) => ({
        id: String(z.id ?? "").trim(),
        label: String(z.label ?? "").trim(),
        region: String(z.region ?? "").trim(),
        rate: Number(z.rate ?? 0),
        enabled: Boolean(z.enabled ?? true),
      }))
      .filter((z) => z.id && z.label && Number.isFinite(z.rate) && z.rate >= 0);

    await mergeSiteSettings({ deliveryZones: zones });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/settings/delivery-zones PATCH]", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
