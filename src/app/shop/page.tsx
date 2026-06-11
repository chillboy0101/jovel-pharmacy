import ShopClient from "./ShopClient";
import {
  getStorefrontCategories,
  getStorefrontProducts,
  normalizeSort,
  STOREFRONT_PAGE_SIZE,
} from "@/lib/storefront";

export const dynamic = "force-dynamic";

type ShopSearchParams = {
  cat?: string | string[];
  search?: string | string[];
  q?: string | string[];
  badge?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

type Props = {
  searchParams: Promise<ShopSearchParams>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const parsed = value ? parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCat = firstParam(params.cat) || "all";
  const search = firstParam(params.search) || firstParam(params.q) || "";
  const badge = firstParam(params.badge) || "";
  const requestedSort = normalizeSort(firstParam(params.sort));
  const sort =
    requestedSort === "default" &&
    (badge === "sale" || badge === "bestseller" || badge === "new")
      ? badge
      : requestedSort;
  const page = parsePage(firstParam(params.page));

  const [categories, productPage] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontProducts({
      cat: selectedCat,
      search,
      badge,
      sort,
      page,
      pageSize: STOREFRONT_PAGE_SIZE,
    }),
  ]);

  return (
    <ShopClient
      initialProducts={productPage.products}
      initialCategories={categories}
      initialSelectedCat={selectedCat}
      initialSearch={search}
      initialBadge={badge}
      initialSort={sort}
      initialPage={page}
      initialTotalPages={productPage.totalPages}
      initialTotalCount={productPage.totalCount}
    />
  );
}
