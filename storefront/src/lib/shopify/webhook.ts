import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Whether Shopify sent this webhook. The X-Shopify-Hmac-Sha256 header is the base64 HMAC-SHA256 of
 * the raw body, keyed with the client secret of the app that subscribed to it. The body has to be
 * the bytes as they arrived: parsing and serializing the JSON again changes them.
 */
export function isShopifySignature(
  body: Uint8Array,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(signature, "base64");
  // timingSafeEqual throws on buffers of different lengths, and the length gives nothing away.
  return given.length === expected.length && timingSafeEqual(given, expected);
}
