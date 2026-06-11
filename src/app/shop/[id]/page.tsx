import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import {
  getProductDisplayDescription,
  getRelatedStorefrontProducts,
  getStorefrontCategories,
  getStorefrontProduct,
} from "@/lib/storefront";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getStorefrontProduct(id);

  if (!product) notFound();

  const [categories, related] = await Promise.all([
    getStorefrontCategories(),
    getRelatedStorefrontProducts(product),
  ]);
  const category = categories.find((item) => item.id === product.categoryId);
  const displayDescription = getProductDisplayDescription({
    ...product,
    categoryName: category?.name ?? product.categoryName,
  });
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: displayDescription,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    sku: product.id,
    url: absoluteUrl(`/shop/${product.id}`),
    category: category?.name,
    brand: {
      "@type": "Brand",
      name: "Jovel Pharmacy",
    },
    aggregateRating:
      product.rating > 0 && product.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        product={product}
        categories={categories}
        related={related}
        displayDescription={displayDescription}
      />
    </>
  );
}
