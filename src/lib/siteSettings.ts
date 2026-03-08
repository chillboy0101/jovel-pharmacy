import { promises as fs } from "fs";
import path from "path";

export type DeliveryZone = {
  id: string;
  label: string;
  region?: string;
  rate: number;
  enabled: boolean;
};

export type NewsletterSubscriber = {
  email: string;
  isActive: boolean;
  createdAt: string;
  unsubscribedAt?: string;
};

export type HealthTip = {
  id: string;
  title: string;
  contentHtml: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
};

function toHealthTipStatus(v: unknown): HealthTip["status"] {
  return v === "published" ? "published" : "draft";
}

export type SiteSettings = {
  momoMerchantId?: string;
  momoMerchantName?: string;
  deliveryZones?: DeliveryZone[];
  newsletterSubscribers?: NewsletterSubscriber[];
  healthTips?: HealthTip[];
  about?: {
    storyTitle?: string;
    storyParagraph1?: string;
    storyParagraph2?: string;
  };
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "site-settings.json");

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SiteSettings;
  } catch {
    return {};
  }
}

export async function writeSiteSettings(next: SiteSettings) {
  const safe: SiteSettings = {
    momoMerchantId:
      typeof next.momoMerchantId === "string" ? next.momoMerchantId : "",
    momoMerchantName:
      typeof next.momoMerchantName === "string" ? next.momoMerchantName : "",
    deliveryZones: Array.isArray(next.deliveryZones)
      ? next.deliveryZones
          .filter((z): z is DeliveryZone => !!z && typeof z === "object")
          .map((z) => ({
            id: typeof z.id === "string" ? z.id : "",
            label: typeof z.label === "string" ? z.label : "",
            region: typeof z.region === "string" ? z.region : "",
            rate: typeof z.rate === "number" && Number.isFinite(z.rate) ? z.rate : 0,
            enabled: typeof z.enabled === "boolean" ? z.enabled : true,
          }))
      : [],
    newsletterSubscribers: Array.isArray(next.newsletterSubscribers)
      ? next.newsletterSubscribers
          .filter((s): s is NewsletterSubscriber => !!s && typeof s === "object")
          .map((s) => ({
            email: typeof s.email === "string" ? s.email : "",
            isActive: typeof s.isActive === "boolean" ? s.isActive : true,
            createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
            unsubscribedAt: typeof s.unsubscribedAt === "string" ? s.unsubscribedAt : undefined,
          }))
          .filter((s) => !!s.email)
      : [],
    healthTips: Array.isArray(next.healthTips)
      ? next.healthTips
          .filter((t): t is HealthTip => !!t && typeof t === "object")
          .map((t) => ({
            id: typeof t.id === "string" ? t.id : "",
            title: typeof t.title === "string" ? t.title : "",
            contentHtml: typeof t.contentHtml === "string" ? t.contentHtml : "",
            status: toHealthTipStatus(t.status),
            publishedAt: typeof t.publishedAt === "string" ? t.publishedAt : undefined,
            createdAt: typeof t.createdAt === "string" ? t.createdAt : new Date().toISOString(),
          }))
          .filter((t) => !!t.id && !!t.title)
      : [],
    about: {
      storyTitle:
        typeof next.about?.storyTitle === "string" ? next.about.storyTitle : "",
      storyParagraph1:
        typeof next.about?.storyParagraph1 === "string"
          ? next.about.storyParagraph1
          : "",
      storyParagraph2:
        typeof next.about?.storyParagraph2 === "string"
          ? next.about.storyParagraph2
          : "",
    },
  };

  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(safe, null, 2) + "\n", "utf8");
}

export async function mergeSiteSettings(patch: Partial<SiteSettings>) {
  const current = await readSiteSettings();
  const merged: SiteSettings = {
    ...current,
    ...patch,
    deliveryZones: Array.isArray(patch.deliveryZones)
      ? patch.deliveryZones
      : current.deliveryZones,
    newsletterSubscribers: Array.isArray(patch.newsletterSubscribers)
      ? patch.newsletterSubscribers
      : current.newsletterSubscribers,
    healthTips: Array.isArray(patch.healthTips) ? patch.healthTips : current.healthTips,
    about: {
      ...(current.about ?? {}),
      ...(patch.about ?? {}),
    },
  };
  await writeSiteSettings(merged);
}
