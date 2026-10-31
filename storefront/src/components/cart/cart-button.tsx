"use client";

import { Suspense, use } from "react";
import { formatPlural } from "@/i18n/format";
import { useI18n } from "@/i18n/i18n-context";
import { useCart } from "./cart-context";

export function CartButton() {
  const { open } = useCart();
  const { cart } = useI18n().dictionary;
  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      className="font-medium underline-offset-4 hover:underline"
    >
      {cart.bag}
      <Suspense fallback={null}>
        <CartCount />
      </Suspense>
    </button>
  );
}

function CartCount() {
  const { cartPromise } = useCart();
  const { locale, dictionary } = useI18n();
  const quantity = use(cartPromise)?.totalQuantity ?? 0;
  if (quantity === 0) return null;
  return (
    <span className="tabular-nums">
      {" "}
      ({quantity}
      <span className="sr-only"> {formatPlural(locale, dictionary.cart.items, quantity)}</span>)
    </span>
  );
}
