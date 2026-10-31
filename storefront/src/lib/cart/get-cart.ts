import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { buyerIp } from "../buyer-ip";
import { fetchCart } from "../shopify/cart";

export const CART_COOKIE = "everhem_cart";

/** Request-time data: render whatever reads it inside a Suspense boundary. */
export async function getCart() {
  // Link prefetches can read cookies too, but they end before Shopify answers. Only a visit reads the cart.
  await connection();
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return null;
  try {
    // Shopify drops carts some days after their last change; the next add creates a new one.
    return await fetchCart(cartId, { buyerIp: await buyerIp() });
  } catch (error) {
    // Every page reads the cart, so a failed read shows an empty bag rather than an error page.
    console.error("cart.fetch.failed", error);
    return null;
  }
}
