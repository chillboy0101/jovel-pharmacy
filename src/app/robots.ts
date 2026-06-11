import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/auth",
          "/checkout",
          "/cart",
          "/account",
          "/receipt",
          "/consult/video",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
