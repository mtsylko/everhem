import "server-only";
import { headers } from "next/headers";

/** The shopper's IP, for the Shopify-Storefront-Buyer-IP header on request-time calls. */
export async function buyerIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}
