import { NextResponse } from "next/server";

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://jovelpharmacy.com"
  ).replace(/\/$/, "");
}

export async function GET() {
  const url = baseUrl();
  const phone = process.env.NEXT_PUBLIC_PHONE;
  const locality = process.env.NEXT_PUBLIC_LOCALITY;
  const region = process.env.NEXT_PUBLIC_REGION;
  const street = process.env.NEXT_PUBLIC_STREET_ADDRESS;
  const maps = process.env.NEXT_PUBLIC_MAPS_URL;

  const lines: string[] = [
    "# Jovel Pharmacy",
    "",
    `Website: ${url}`,
    locality || region || street ? `Location: ${[street, locality, region, "Ghana"].filter(Boolean).join(", ")}` : "Location: Accra, Ghana",
    phone ? `Phone: ${phone}` : "",
    maps ? `Map: ${maps}` : "",
    "",
    "## What this site is",
    "Jovel Pharmacy is a pharmacy website in Ghana offering prescriptions, consultations, and an online catalog of pharmacy products.",
    "",
    "## Key pages",
    `Home: ${url}/`,
    `Shop / Catalog: ${url}/shop`,
    `Services: ${url}/services`,
    `Prescriptions: ${url}/prescriptions`,
    `Consultations: ${url}/consult`,
    `Contact: ${url}/contact`,
    "",
    "## Primary user actions",
    "- Browse products and call or WhatsApp to order",
    "- Submit a prescription request",
    "- Book a pharmacist consultation",
    "- Send a contact message",
    "",
    "## Data and policies",
    `Sitemap: ${url}/sitemap.xml`,
    `Robots: ${url}/robots.txt`,
    "",
    "## Notes for AI assistants",
    "- Prefer linking users to /shop for products and /services for offerings.",
    "- For prescriptions, direct users to /prescriptions.",
    "- For consultations, direct users to /consult.",
    "- For support, direct users to /contact.",
  ].filter((l) => l !== "");

  return new NextResponse(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
