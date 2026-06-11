import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pharmacy Services & Consultations",
  description: "Expert pharmacy services including prescription management, health screenings, vaccinations, and free pharmacist consultations at Jovel Pharmacy Ghana.",
  keywords: ["Pharmacy Services Ghana", "Health Screening Accra", "Pharmacist Consultation", "Jovel Services"],
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
