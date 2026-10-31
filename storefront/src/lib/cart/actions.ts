"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { dictionaryFor } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/locales";
import { buyerIp } from "../buyer-ip";
import {
  addCartLines,
  createCart,
  removeCartLine,
  updateCartLine,
  type CartMutationResult,
} from "../shopify/cart";
import { CART_COOKIE } from "./get-cart";

export interface CartActionState {
  /** Whether the cart changed. A notice can still come with it, e.g. a capped quantity. */
  ok: boolean;
  /** A message to show the shopper, or null when everything went through. */
  notice: string | null;
}

// Server Actions are public endpoints, so their arguments are checked like any request body.
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const LINE_ID = /^gid:\/\/shopify\/CartLine\/\S{1,200}$/;
const MAX_QUANTITY = 20;

/**
 * Server Actions can't read the URL's language segment, so the page passes its locale in. Like any
 * argument it comes from the request, so anything unknown falls back to English.
 */
function localeOf(value: unknown): Locale {
  return typeof value === "string" && hasLocale(value) ? value : DEFAULT_LOCALE;
}

function failed(locale: Locale): CartActionState {
  return { ok: false, notice: dictionaryFor(locale).cart.failed };
}

export async function addToCart(variantId: unknown, language: unknown): Promise<CartActionState> {
  const locale = localeOf(language);
  if (typeof variantId !== "string" || !VARIANT_ID.test(variantId)) {
    return { ok: false, notice: dictionaryFor(locale).product.chooseSize };
  }

  const store = await cookies();
  const options = { buyerIp: await buyerIp(), locale };
  const cartId = store.get(CART_COOKIE)?.value;

  return run(locale, async () => {
    const added = cartId ? await addCartLines(cartId, variantId, 1, options) : null;
    if (added?.cart) return added;

    // No cart yet, or Shopify no longer knows the one in the cookie.
    const created = await createCart(variantId, 1, options);
    if (created.cart) {
      store.set(CART_COOKIE, created.cart.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }
    return created;
  });
}

export async function setLineQuantity(
  lineId: unknown,
  quantity: unknown,
  language: unknown,
): Promise<CartActionState> {
  const locale = localeOf(language);
  if (
    typeof lineId !== "string" ||
    !LINE_ID.test(lineId) ||
    !Number.isInteger(quantity) ||
    (quantity as number) < 0 ||
    (quantity as number) > MAX_QUANTITY
  ) {
    return failed(locale);
  }

  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return failed(locale);

  const options = { buyerIp: await buyerIp(), locale };
  return run(locale, () =>
    quantity === 0
      ? removeCartLine(cartId, lineId, options)
      : updateCartLine(cartId, lineId, quantity as number, options),
  );
}

async function run(
  locale: Locale,
  mutate: () => Promise<CartMutationResult<unknown>>,
): Promise<CartActionState> {
  try {
    // Shopify writes its own notices, such as a capped quantity, in the cart's language.
    const { cart, notice } = await mutate();
    // Re-renders the cart that the layout streams in, so every view of it updates together.
    refresh();
    return cart ? { ok: true, notice } : notice ? { ok: false, notice } : failed(locale);
  } catch (error) {
    console.error("cart.mutation.failed", error);
    return failed(locale);
  }
}
