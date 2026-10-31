"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
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

const SOMETHING_WENT_WRONG = "Something went wrong. Please try again.";
const FAILED: CartActionState = { ok: false, notice: SOMETHING_WENT_WRONG };

export async function addToCart(variantId: unknown): Promise<CartActionState> {
  if (typeof variantId !== "string" || !VARIANT_ID.test(variantId)) {
    return { ok: false, notice: "Choose a size first." };
  }

  const store = await cookies();
  const options = { buyerIp: await buyerIp() };
  const cartId = store.get(CART_COOKIE)?.value;

  return run(async () => {
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
): Promise<CartActionState> {
  if (
    typeof lineId !== "string" ||
    !LINE_ID.test(lineId) ||
    !Number.isInteger(quantity) ||
    (quantity as number) < 0 ||
    (quantity as number) > MAX_QUANTITY
  ) {
    return FAILED;
  }

  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return FAILED;

  const options = { buyerIp: await buyerIp() };
  return run(() =>
    quantity === 0
      ? removeCartLine(cartId, lineId, options)
      : updateCartLine(cartId, lineId, quantity as number, options),
  );
}

async function run(mutate: () => Promise<CartMutationResult<unknown>>): Promise<CartActionState> {
  try {
    const { cart, notice } = await mutate();
    // Re-renders the cart that the layout streams in, so every view of it updates together.
    refresh();
    return cart ? { ok: true, notice } : { ok: false, notice: notice ?? SOMETHING_WENT_WRONG };
  } catch (error) {
    console.error("cart.mutation.failed", error);
    return FAILED;
  }
}
