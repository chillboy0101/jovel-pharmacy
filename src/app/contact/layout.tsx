import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Find a Branch",
  description: "Contact Jovel Pharmacy for prescription inquiries, product questions, or support. Visit our branches in La Trade Fair and La Nativity, Accra.",
  keywords: ["Contact Jovel Pharmacy", "Pharmacy Near Me Accra", "Jovel Pharmacy Phone Number", "La Trade Fair Pharmacy"],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
