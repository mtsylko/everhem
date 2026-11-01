import { setTimeout as sleep } from "node:timers/promises";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { CATALOG_TAG } from "@/lib/shopify/catalog";
import { isShopifySignature } from "@/lib/shopify/webhook";

/**
 * How long the Storefront API can go on answering with data from before an edit. It is often
 * instant, but in tests it took up to 12 seconds, and a minute leaves room for a slow day.
 */
const STOREFRONT_LAG_MS = 60_000;

/**
 * Shopify calls this when a product, a collection or a stock level changes: the seed subscribes it
 * to those topics. Each one means the same thing here, so the topic and the payload go unread.
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("webhook.failed", new Error("SHOPIFY_WEBHOOK_SECRET is not set"));
    return new Response(null, { status: 500 });
  }

  // Without the check, anyone could keep the catalog expired and send every visit to Shopify.
  const body = new Uint8Array(await request.arrayBuffer());
  if (!isShopifySignature(body, request.headers.get("x-shopify-hmac-sha256"), secret)) {
    return new Response(null, { status: 401 });
  }

  // Expired rather than stale: the next visitor waits for Shopify instead of seeing an old price or
  // a size that has just sold out. updateTag would do the same, but only Server Actions can call it.
  // Shopify retries and sometimes repeats a delivery, which is harmless: expiring twice is once.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  console.info("webhook.revalidated", request.headers.get("x-shopify-topic"));

  // A visit before the Storefront API catches up would cache the old data again, for an hour. So
  // the catalog expires once more a minute later, when Shopify has caught up.
  after(async () => {
    await sleep(STOREFRONT_LAG_MS);
    revalidateTag(CATALOG_TAG, { expire: 0 });
  });
  return new Response(null, { status: 200 });
}
