import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prescriptions",
  description:
    "Upload, refill, or transfer prescriptions with Jovel Pharmacy for reliable support in Ghana.",
  keywords: [
    "Jovel Pharmacy prescriptions",
    "Prescription refill Ghana",
    "Prescription upload pharmacy",
  ],
  alternates: {
    canonical: "/prescriptions",
  },
};

export default function PrescriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
