import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jovel Pharmacy | Your Community Pharmacy, Where Service Counts",
    template: "%s | Jovel Pharmacy",
  },
  description:
    "Jovel Pharmacy is your trusted community pharmacy in Ghana. We provide prescriptions, expert consultations, and a wide range of wellness products with fast delivery.",
  keywords: ["Jovel", "Jovel Pharmacy", "Pharmacy Ghana", "Online Pharmacy Ghana", "Prescriptions", "Health", "Wellness", "Medicine Delivery"],
  authors: [{ name: "Jovel Pharmacy" }],
  creator: "Jovel Pharmacy",
  publisher: "Jovel Pharmacy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://jovelpharmacy.com",
  ),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Jovel Pharmacy",
    title: "Jovel Pharmacy | Your Community Pharmacy, Where Service Counts",
    description:
      "Your trusted community pharmacy in Ghana. Providing prescriptions, consultations, and wellness products with reliable delivery and in-store pickup.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Jovel Pharmacy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jovel Pharmacy | Your Community Pharmacy, Where Service Counts",
    description:
      "Your trusted community pharmacy in Ghana. Providing prescriptions, consultations, and wellness products.",
    images: ["/logo.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } }
      : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://jovelpharmacy.com";
  const addressLocality = process.env.NEXT_PUBLIC_LOCALITY;
  const addressRegion = process.env.NEXT_PUBLIC_REGION;
  const streetAddress = process.env.NEXT_PUBLIC_STREET_ADDRESS;
  const postalCode = process.env.NEXT_PUBLIC_POSTAL_CODE;
  const telephone = process.env.NEXT_PUBLIC_PHONE;
  const latitude = process.env.NEXT_PUBLIC_LATITUDE;
  const longitude = process.env.NEXT_PUBLIC_LONGITUDE;
  const mapsUrl = process.env.NEXT_PUBLIC_MAPS_URL;
  const sameAs = (process.env.NEXT_PUBLIC_SAME_AS_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: "Jovel Pharmacy",
    url: baseUrl,
    image: `${baseUrl.replace(/\/$/, "")}/logo-transparent.png`,
    description:
      "A trusted pharmacy in Ghana providing prescriptions, consultations, and wellness products with delivery and in-store pickup.",
    areaServed: "Ghana",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "07:30",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "14:00",
        "closes": "22:00"
      }
    ],
    ...(telephone ? { telephone } : {}),
    ...(mapsUrl ? { hasMap: mapsUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(streetAddress || addressLocality || addressRegion || postalCode
      ? {
          address: {
            "@type": "PostalAddress",
            ...(streetAddress ? { streetAddress } : {}),
            ...(addressLocality ? { addressLocality } : {}),
            ...(addressRegion ? { addressRegion } : {}),
            addressCountry: "GH",
            ...(postalCode ? { postalCode } : {}),
          },
        }
      : {}),
    ...(latitude && longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude,
            longitude,
          },
        }
      : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Jovel Pharmacy",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl.replace(/\/$/, "")}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <ChatWidget />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
