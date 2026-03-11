import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Our Story & Values",
  description: "Learn about Jovel Pharmacy's mission to provide personalized, accessible healthcare in Ghana. Meet our team of dedicated pharmacists.",
  keywords: ["About Jovel Pharmacy", "Pharmacy Team Ghana", "Jovel Story", "Healthcare Mission"],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
