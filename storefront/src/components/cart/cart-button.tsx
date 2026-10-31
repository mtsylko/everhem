"use client";

import { Suspense, use } from "react";
import { useCart } from "./cart-context";

export function CartButton() {
  const { open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      className="font-medium underline-offset-4 hover:underline"
    >
      Bag
      <Suspense fallback={null}>
        <CartCount />
      </Suspense>
    </button>
  );
}

function CartCount() {
  const { cartPromise } = useCart();
  const quantity = use(cartPromise)?.totalQuantity ?? 0;
  if (quantity === 0) return null;
  return (
    <span className="tabular-nums">
      {" "}
      ({quantity}
      <span className="sr-only"> {quantity === 1 ? "item" : "items"}</span>)
    </span>
  );
}
