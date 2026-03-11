import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Health & Wellness Products",
  description: "Browse Jovel Pharmacy's extensive catalog of premium health, wellness, and medicinal products. Quality healthcare delivered to your door in Ghana.",
  keywords: ["Jovel Pharmacy Shop", "Medicine Ghana", "Wellness Products Accra", "Buy Medicine Online Ghana", "Jovel Shop"],
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
