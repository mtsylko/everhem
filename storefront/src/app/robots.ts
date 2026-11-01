import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/metadata";

/**
 * Crawlers may fetch everything. Search results keep themselves out of the index with noindex,
 * which a crawler only sees if it is allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
