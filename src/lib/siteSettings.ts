import { promises as fs } from "fs";
import path from "path";

export type SiteSettings = {
  momoMerchantId?: string;
  momoMerchantName?: string;
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
    about: {
      ...(current.about ?? {}),
      ...(patch.about ?? {}),
    },
  };
  await writeSiteSettings(merged);
}
