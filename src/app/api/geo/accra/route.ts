import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const upstream = new URL("https://nominatim.openstreetmap.org/search");
    upstream.searchParams.set("format", "jsonv2");
    upstream.searchParams.set("addressdetails", "1");
    upstream.searchParams.set("limit", "8");
    upstream.searchParams.set("countrycodes", "gh");
    upstream.searchParams.set("q", `${q}, Accra, Ghana`);

    const r = await fetch(upstream.toString(), {
      headers: {
        "User-Agent": "JovelPharmacy/1.0 (support@jovelpharmacy.com)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!r.ok) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const raw = (await r.json()) as unknown;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ results: [] });
    }

    const results = raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        place_id: String(x.place_id ?? ""),
        display_name: String(x.display_name ?? ""),
        lat: String(x.lat ?? ""),
        lon: String(x.lon ?? ""),
        address: (x.address ?? null) as unknown,
      }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/geo/accra GET]", err);
    return NextResponse.json({ results: [] });
  }
}
