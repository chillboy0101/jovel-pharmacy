import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pharmacist Consultation",
  description:
    "Book a pharmacist consultation with Jovel Pharmacy in Ghana by video, phone, or in store.",
  keywords: [
    "Jovel Pharmacy consultation",
    "Pharmacist consultation Ghana",
    "Online pharmacy consultation",
  ],
  alternates: {
    canonical: "/consult",
  },
};

export default function ConsultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
