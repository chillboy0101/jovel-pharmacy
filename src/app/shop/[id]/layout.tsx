import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jovelpharmacy.com";
    const res = await fetch(`${baseUrl}/api/products/${id}`);
    if (!res.ok) throw new Error();
    const product = await res.json();

    return {
      title: `${product.name} | ${product.brand}`,
      description: product.description.slice(0, 160),
      keywords: [product.name, product.brand, product.category, "Jovel Pharmacy", "Ghana"],
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      },
    };
  } catch {
    return {
      title: "Product Details | Jovel Pharmacy",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
