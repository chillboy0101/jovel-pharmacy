const CANONICAL_SITE_URL = "https://jovelpharmacy.com";

export function getSiteUrl() {
  return CANONICAL_SITE_URL;
}

export function absoluteUrl(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${cleanPath}`;
}

export function truncateMetaDescription(
  value: string | null | undefined,
  maxLength = 155,
) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 3).replace(/\s+\S*$/, "")}...`;
}
