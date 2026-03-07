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
    default: "Jovel Pharmacy",
    template: "%s · Jovel Pharmacy",
  },
  description:
    "Jovel Pharmacy — a trusted pharmacy in Ghana providing prescriptions, consultations, and wellness products with delivery and in-store pickup.",
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
    title: "Jovel Pharmacy",
    description:
      "A trusted pharmacy in Ghana providing prescriptions, consultations, and wellness products with delivery and in-store pickup.",
    images: [
      {
        url: "/logo-transparent.png",
        width: 1200,
        height: 630,
        alt: "Jovel Pharmacy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jovel Pharmacy",
    description:
      "A trusted pharmacy in Ghana providing prescriptions, consultations, and wellness products with delivery and in-store pickup.",
    images: ["/logo-transparent.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
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
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: "Jovel Pharmacy",
    url: baseUrl,
    image: `${baseUrl.replace(/\/$/, "")}/logo-transparent.png`,
    description:
      "A trusted pharmacy in Ghana providing prescriptions, consultations, and wellness products with delivery and in-store pickup.",
    areaServed: "Ghana",
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
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
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
