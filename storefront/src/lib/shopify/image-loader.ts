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

/**
 * Asks the CDN for a square of an image, centred on (x, y) and `side` wide, as fractions of its
 * width (x, side) and height (y). A close-up then downloads small and sharp instead of as the whole
 * picture scaled up. Without the image's size it can't place the square and returns the whole image.
 */
export function cropSquare(
  image: { url: string; width?: number | null; height?: number | null },
  x: number,
  y: number,
  side: number,
): string {
  const { url, width, height } = image;
  if (!width || !height || !url.startsWith("https://cdn.shopify.com/")) return url;
  const size = Math.round(width * side);
  const crop = new URL(url);
  crop.searchParams.set("crop", "region");
  crop.searchParams.set("crop_left", String(Math.round(width * x - size / 2)));
  crop.searchParams.set("crop_top", String(Math.round(height * y - size / 2)));
  crop.searchParams.set("crop_width", String(size));
  crop.searchParams.set("crop_height", String(size));
  return crop.toString();
}
