import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";

type ScabProduct = {
  source: "scabpharmacy.com";
  url: string;
  name: string;
  priceText: string | null;
  imageUrls: string[];
  descriptionText: string | null;
  sku: string | null;
  categories: string[];
  downloadedImages: Array<{ sourceUrl: string; filePath: string; sha256: string }>;
};

const PROVIDER_ORIGIN = "https://www.scabpharmacy.com";
const SHOP_PATH = "/shop/";
const SHOP_URL = `${PROVIDER_ORIGIN}${SHOP_PATH}`;

const USER_AGENT =
  "JovelPharmacy-Bot/1.0 (inventory-sync; contact: jovelpharmacy@example.com)";

const REQUEST_DELAY_MS = 3100; // >= 3 seconds per agreement

function readArgValue(name: string) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : null;
}

function shopPageUrl(page: number) {
  if (page <= 1) return SHOP_URL;
  return `${SHOP_URL}page/${page}/`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function sanitizeFileName(input: string) {
  const s = input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return s || "file";
}

function nowIsOffPeakLocal() {
  const hour = new Date().getHours();
  // Agreement: 11:00 PM to 6:00 AM local server time
  return hour >= 23 || hour < 6;
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}

async function fetchBinary(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function robotsAllowsShop(robotsTxt: string) {
  // Simple, conservative check: if any Disallow rule for /shop exists, we treat it as blocked.
  // Agreement says we must respect robots.txt.
  const lines = robotsTxt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^disallow\s*:\s*(.*)$/i);
    if (!m) continue;
    const dis = m[1].trim();
    if (!dis) continue;
    if (dis === "/" || dis.startsWith(SHOP_PATH)) return false;
  }
  return true;
}

function extractShopProductLinks(html: string) {
  const $ = cheerio.load(html);

  // Common WooCommerce patterns
  const links = new Set<string>();

  $("a.woocommerce-LoopProduct-link").each((_i: number, el: any) => {
    const href = $(el).attr("href");
    if (href) links.add(href);
  });

  $("li.product a[href]").each((_i: number, el: any) => {
    const href = $(el).attr("href");
    if (href && href.includes(PROVIDER_ORIGIN)) links.add(href);
  });

  // WooCommerce Blocks patterns and generic fallbacks
  $("a.wc-block-grid__product-link[href]").each((_i: number, el: any) => {
    const href = $(el).attr("href");
    if (href) links.add(href);
  });

  // Last resort: any link that looks like a product page
  $("a[href*='/product/']").each((_i: number, el: any) => {
    const href = $(el).attr("href");
    if (href) links.add(href);
  });

  return Array.from(links);
}

function extractNextPageUrl(html: string) {
  const $ = cheerio.load(html);

  // Standard rel=next
  const relNext = $("link[rel='next']").attr("href");
  if (relNext) return relNext;

  // WooCommerce pagination common patterns
  const next =
    $("nav.woocommerce-pagination a.next").attr("href") ||
    $("a.next.page-numbers").attr("href") ||
    $("a.next").attr("href");

  if (next) return next;

  // If pagination exists but no explicit next link, compute based on current page.
  const currentText =
    $("nav.woocommerce-pagination span.current").first().text().trim() ||
    $(".page-numbers.current").first().text().trim();
  const lastText =
    $("nav.woocommerce-pagination a.page-numbers")
      .map((_i: number, el: any) => $(el).text().trim())
      .get()
      .filter((t) => /^\d+$/.test(t))
      .map((t) => parseInt(t, 10))
      .sort((a, b) => b - a)[0]?.toString() ||
    "";

  const current = /^\d+$/.test(currentText) ? parseInt(currentText, 10) : NaN;
  const last = /^\d+$/.test(lastText) ? parseInt(lastText, 10) : NaN;
  if (Number.isFinite(current) && Number.isFinite(last) && current < last) {
    // Prefer WooCommerce paged query param
    return `${SHOP_URL}?paged=${current + 1}`;
  }

  return null;
}

function extractLastPageNumber(html: string) {
  const $ = cheerio.load(html);
  const nums = $("nav.woocommerce-pagination a.page-numbers")
    .map((_i: number, el: any) => $(el).text().trim())
    .get()
    .filter((t) => /^\d+$/.test(t))
    .map((t) => parseInt(t, 10))
    .filter((n) => Number.isFinite(n));

  const max = nums.length ? Math.max(...nums) : NaN;
  return Number.isFinite(max) ? max : null;
}

function normalizeUrl(u: string) {
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${PROVIDER_ORIGIN}${u}`;
  return u;
}

function extractProductFromPage(productUrl: string, html: string): Omit<ScabProduct, "downloadedImages"> {
  const $ = cheerio.load(html);

  const name =
    $("h1.product_title").first().text().trim() ||
    $("h1").first().text().trim() ||
    productUrl;

  const priceText =
    $("p.price").first().text().replace(/\s+/g, " ").trim() || null;

  const sku = $("span.sku").first().text().trim() || null;

  const categories = $("span.posted_in a")
    .map((_i: number, a: any) => $(a).text().trim())
    .get()
    .filter(Boolean);

  const descriptionText =
    $("div.woocommerce-product-details__short-description")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    $("div#tab-description")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    null;

  const imageUrls = new Set<string>();

  // WooCommerce gallery
  $("figure.woocommerce-product-gallery__wrapper img").each((_i: number, img: any) => {
    const src = $(img).attr("data-src") || $(img).attr("src");
    if (src) imageUrls.add(normalizeUrl(src));
  });

  // Fallback
  $("img.wp-post-image").each((_i: number, img: any) => {
    const src = $(img).attr("data-src") || $(img).attr("src");
    if (src) imageUrls.add(normalizeUrl(src));
  });

  return {
    source: "scabpharmacy.com",
    url: productUrl,
    name,
    priceText,
    imageUrls: Array.from(imageUrls),
    descriptionText,
    sku,
    categories,
  };
}

async function main() {
  const outRoot = path.resolve(process.cwd(), "P&E", "scab");
  const outImages = path.join(outRoot, "images");
  ensureDir(outImages);

  const productsPath = path.join(outRoot, "products.json");
  const statePath = path.join(outRoot, "state.json");

  const existingProducts = readJsonFile<ScabProduct[]>(productsPath);
  const products: ScabProduct[] = Array.isArray(existingProducts) ? existingProducts : [];
  const existingState = readJsonFile<{ lastCompletedPage?: number; lastPage?: number }>(statePath);

  if (!nowIsOffPeakLocal() && !process.argv.includes("--force")) {
    console.error(
      "Refusing to run: agreement requires off-peak (11:00 PM–6:00 AM local time). Re-run with --force if you have written approval for a different schedule.",
    );
    process.exit(1);
  }

  console.log(`Checking robots.txt: ${PROVIDER_ORIGIN}/robots.txt`);
  const robots = await fetchText(`${PROVIDER_ORIGIN}/robots.txt`).catch(() => "");
  if (robots && !robotsAllowsShop(robots)) {
    console.error("robots.txt appears to disallow /shop/. Aborting to remain compliant.");
    process.exit(1);
  }

  const visitedPages = new Set<string>();
  const visitedProducts = new Set<string>();
  for (const p of products) {
    if (p?.url) visitedProducts.add(p.url);
  }

  const maxPagesArg = readArgValue("--max-pages");
  const maxPagesFromArg = maxPagesArg ? parseInt(maxPagesArg, 10) : NaN;

  // Fetch page 1 to detect last page (unless overridden)
  const firstHtml = await fetchText(SHOP_URL);

  // Quick health signal
  const $first = cheerio.load(firstHtml);
  const title = $first("title").first().text().trim();
  if (title) console.log(`Page title: ${title}`);

  const detectedLast = extractLastPageNumber(firstHtml);
  const lastPage = Number.isFinite(maxPagesFromArg) && maxPagesFromArg > 0
    ? maxPagesFromArg
    : (detectedLast ?? 1);

  const lastCompleted = typeof existingState?.lastCompletedPage === "number" ? existingState.lastCompletedPage : 0;
  const startPageArg = readArgValue("--start-page");
  const startPageFromArg = startPageArg ? parseInt(startPageArg, 10) : NaN;
  const startPage = Number.isFinite(startPageFromArg) && startPageFromArg > 0 ? startPageFromArg : Math.max(1, lastCompleted + 1);

  writeJsonFile(statePath, { lastCompletedPage: Math.max(0, lastCompleted), lastPage });

  console.log(`Crawling shop pages ${startPage}..${lastPage}`);

  for (let page = startPage; page <= lastPage; page++) {
    const pageUrl = shopPageUrl(page);
    if (visitedPages.has(pageUrl)) continue;
    visitedPages.add(pageUrl);

    console.log(`Fetching shop page: ${pageUrl}`);
    const html = page === 1 ? firstHtml : await fetchText(pageUrl);

    const links = extractShopProductLinks(html);
    console.log(`Found ${links.length} product links`);

    if (links.length === 0) {
      ensureDir(outRoot);
      fs.writeFileSync(path.join(outRoot, `debug-shop-page-${page}.html`), html);
      console.error(
        `No product links found on page ${page}. Saved HTML to P&E/scab/debug-shop-page-${page}.html. Stopping early.`,
      );
      break;
    }

    for (const link of links) {
      const u = normalizeUrl(link);
      if (visitedProducts.has(u)) continue;
      visitedProducts.add(u);

      await sleep(REQUEST_DELAY_MS);
      console.log(`Fetching product: ${u}`);
      const pHtml = await fetchText(u);
      const base = extractProductFromPage(u, pHtml);

      const downloadedImages: ScabProduct["downloadedImages"] = [];
      for (let i = 0; i < base.imageUrls.length; i++) {
        const imgUrl = base.imageUrls[i];
        if (imgUrl.startsWith("data:")) continue;
        try {
          await sleep(REQUEST_DELAY_MS);
          const ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
          const fileBase = sanitizeFileName(`${base.name}-${i + 1}`);
          const filePath = path.join(outImages, `${fileBase}${ext}`);

          if (fs.existsSync(filePath)) {
            downloadedImages.push({ sourceUrl: imgUrl, filePath, sha256: "existing" });
            continue;
          }

          const buf = await fetchBinary(imgUrl);
          const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
          fs.writeFileSync(filePath, buf);
          downloadedImages.push({ sourceUrl: imgUrl, filePath, sha256 });
        } catch (err) {
          console.warn(`Image download failed: ${imgUrl}`, err);
        }
      }

      products.push({ ...base, downloadedImages });

      // Incremental save in case the run is interrupted
      writeJsonFile(productsPath, products);
    }

    writeJsonFile(statePath, { lastCompletedPage: page, lastPage });

    if (page < lastPage) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log(`Done. Downloaded ${products.length} products.`);
  console.log(`Output folder: ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
