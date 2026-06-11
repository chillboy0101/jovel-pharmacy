import type { Metadata } from "next";
import { truncateMetaDescription } from "@/lib/seo";
import {
  getProductDisplayDescription,
  getStorefrontProduct,
} from "@/lib/storefront";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await getStorefrontProduct(id);
    if (!product) {
      return {
        title: "Product Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const description =
      truncateMetaDescription(getProductDisplayDescription(product)) ||
      `Find ${product.name} at Jovel Pharmacy in Ghana.`;

    return {
      title: product.name,
      description,
      keywords: [product.name, "Jovel Pharmacy", "Pharmacy Ghana", "Medicine Ghana"],
      alternates: {
        canonical: `/shop/${product.id}`,
      },
      openGraph: {
        title: `${product.name} | Jovel Pharmacy`,
        description,
        url: `/shop/${product.id}`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Jovel Pharmacy`,
        description,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Product Details | Jovel Pharmacy",
      robots: {
        index: false,
        follow: true,
      },
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
