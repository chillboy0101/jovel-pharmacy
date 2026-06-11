import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getSitemapProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/prescriptions`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/consult`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.6 },
  ];

  try {
    const products = await getSitemapProducts();

    for (const p of products) {
      entries.push({
        url: `${baseUrl}/shop/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // ignore; sitemap will still include core pages
  }

  return entries;
}
