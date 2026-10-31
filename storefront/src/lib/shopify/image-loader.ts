"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Shopify's CDN resizes images itself and picks WebP or AVIF from the Accept header,
 * so next/image only has to ask for the right width.
 */
export default function shopifyImageLoader({ src, width }: ImageLoaderProps): string {
  if (!src.startsWith("https://cdn.shopify.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  return url.toString();
}
