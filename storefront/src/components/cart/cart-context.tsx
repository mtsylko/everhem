"use client";

import { createContext, use, useState, type ReactNode } from "react";
import type { Cart } from "@/lib/shopify/cart";

interface CartContextValue {
  /** Streams in from the layout; read it with use() inside a Suspense boundary. */
  cartPromise: Promise<Cart | null>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  cartPromise,
  children,
}: {
  cartPromise: Promise<Cart | null>;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <CartContext
      value={{ cartPromise, isOpen, open: () => setOpen(true), close: () => setOpen(false) }}
    >
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>.");
  return value;
}
