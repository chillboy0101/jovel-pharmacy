import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Category, Product } from "@/lib/types";

export type SortKey =
  | "default"
  | "rating"
  | "name"
  | "sale"
  | "bestseller"
  | "new";

export const STOREFRONT_PAGE_SIZE = 12;
export const SITEMAP_PRODUCT_LIMIT = 500;

const productSelect = {
  id: true,
  name: true,
  categoryId: true,
  category: {
    select: {
      name: true,
    },
  },
  originalPrice: true,
  discountPercent: true,
  costPrice: true,
  description: true,
  dosage: true,
  rating: true,
  reviews: true,
  stock: true,
  badge: true,
  emoji: true,
  imageUrl: true,
  expiryDate: true,
  sourceSlug: true,
  sourceUrl: true,
} satisfies Prisma.ProductSelect;

type StorefrontProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

function cleanText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

export function isWeakProductDescription(
  name: string,
  description: string | null | undefined,
) {
  const normalizedName = cleanText(name).toLowerCase();
  const normalizedDescription = cleanText(description).toLowerCase();

  if (normalizedDescription.length < 40) return true;
  return (
    normalizedDescription === normalizedName ||
    normalizedDescription === `${normalizedName}.`
  );
}

export function getProductDisplayDescription(
  product: Pick<Product, "name" | "description"> & {
    categoryName?: string | null;
  },
) {
  const description = cleanText(product.description);
  if (!isWeakProductDescription(product.name, description)) return description;

  const productName = cleanText(product.name) || "this product";
  const categoryName = cleanText(product.categoryName);
  const categoryPhrase = categoryName ? ` in ${categoryName}` : "";

  return `Ask Jovel Pharmacy about ${productName}${categoryPhrase}. Available for pharmacy support, order checks, pickup, and delivery in Ghana.`;
}

export function isIndexableProductSlug(id: string) {
  const slug = id.trim();

  return (
    slug.length >= 6 &&
    slug === slug.toLowerCase() &&
    /[a-z]/.test(slug) &&
    !/^\d+$/.test(slug) &&
    !/^wd-/.test(slug)
  );
}

function storefrontBaseConditions(now = new Date()): Prisma.ProductWhereInput[] {
  return [
    { OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
    { imageUrl: { not: null } },
    { imageUrl: { not: "" } },
    { imageUrl: { not: "null" } },
    { name: { not: "" } },
  ];
}

export function normalizeSort(sort: string | null | undefined): SortKey {
  if (
    sort === "rating" ||
    sort === "name" ||
    sort === "sale" ||
    sort === "bestseller" ||
    sort === "new"
  ) {
    return sort;
  }

  return "default";
}

function getProductOrderBy(
  sort: SortKey,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
    case "sale":
    case "bestseller":
      return [{ rating: "desc" }, { reviews: "desc" }, { updatedAt: "desc" }];
    case "name":
      return [{ name: "asc" }];
    case "new":
      return [{ createdAt: "desc" }];
    default:
      return [{ stock: "desc" }, { updatedAt: "desc" }, { name: "asc" }];
  }
}

export function buildStorefrontProductWhere(filters?: {
  cat?: string | null;
  search?: string | null;
  badge?: string | null;
}) {
  const where: Prisma.ProductWhereInput = {
    AND: storefrontBaseConditions(),
  };

  if (filters?.cat && filters.cat !== "all") where.categoryId = filters.cat;
  if (filters?.badge) where.badge = filters.badge;

  const search = filters?.search?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function serializeProduct(product: StorefrontProductRecord): Product {
  const { category, ...productFields } = product;

  return {
    ...productFields,
    categoryName: category?.name ?? null,
    description: cleanText(product.description),
    expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
  };
}

export async function getStorefrontCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      products: {
        some: buildStorefrontProductWhere(),
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getStorefrontProducts(options?: {
  cat?: string | null;
  search?: string | null;
  badge?: string | null;
  sort?: SortKey | string | null;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.min(
    60,
    Math.max(1, options?.pageSize || STOREFRONT_PAGE_SIZE),
  );
  const page = Math.max(1, options?.page || 1);
  const where = buildStorefrontProductWhere(options);
  const sort = normalizeSort(options?.sort);

  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: getProductOrderBy(sort),
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
  ]);

  return {
    products: products.map(serializeProduct),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getStorefrontProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      ...buildStorefrontProductWhere(),
      id,
    },
    select: productSelect,
  });

  return product ? serializeProduct(product) : null;
}

export async function getRelatedStorefrontProducts(product: Product, limit = 4) {
  const related = await prisma.product.findMany({
    where: {
      ...buildStorefrontProductWhere({ cat: product.categoryId }),
      id: { not: product.id },
    },
    select: productSelect,
    orderBy: [{ rating: "desc" }, { reviews: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return related.map(serializeProduct);
}

export async function getSitemapProducts(limit = SITEMAP_PRODUCT_LIMIT) {
  const products = await prisma.product.findMany({
    where: buildStorefrontProductWhere(),
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: Math.min(limit * 3, 2000),
  });

  return products
    .filter((product) => isIndexableProductSlug(product.id))
    .slice(0, limit);
}
