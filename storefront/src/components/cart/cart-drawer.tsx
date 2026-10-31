"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, use, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/i18n-context";
import { localePath } from "@/i18n/locales";
import { setLineQuantity } from "@/lib/cart/actions";
import { selectionToParams } from "@/lib/product/variants";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/shopify/cart";
import { useCart } from "./cart-context";

export function CartDrawer() {
  const { isOpen, close } = useCart();
  const { cart } = useI18n().dictionary;
  const dialog = useRef<HTMLDialogElement>(null);

  // A modal <dialog> traps focus, closes on Escape and makes the page behind it inert.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen && !element.open) element.showModal();
    if (!isOpen && element.open) element.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialog}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="cart-title"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md bg-ground p-0 text-ink backdrop:bg-ink/40 open:flex"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-baseline justify-between px-gutter pt-6 pb-4">
          <h2 id="cart-title" className="text-lead font-medium">
            {cart.title}
          </h2>
          <button type="button" onClick={close} className="underline-offset-4 hover:underline">
            {cart.close}
          </button>
        </div>
        {isOpen && (
          <Suspense fallback={<p className="px-gutter">{cart.loading}</p>}>
            <CartContents />
          </Suspense>
        )}
      </div>
    </dialog>
  );
}

type QuantityChange = { lineId: string; quantity: number };

function CartContents() {
  const { cartPromise, close } = useCart();
  const { locale, dictionary } = useI18n();
  const cart = use(cartPromise);
  const [lines, setOptimisticLines] = useOptimistic(
    cart?.lines.nodes ?? [],
    (current: CartLine[], change: QuantityChange) =>
      current
        .map((line) => (line.id === change.lineId ? withQuantity(line, change.quantity) : line))
        .filter((line) => line.quantity > 0),
  );
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function changeQuantity(lineId: string, quantity: number) {
    setNotice(null);
    startTransition(async () => {
      setOptimisticLines({ lineId, quantity });
      const result = await setLineQuantity(lineId, quantity, locale);
      setNotice(result.notice);
    });
  }

  if (!cart || lines.length === 0) {
    return (
      <div className="px-gutter">
        <p>{dictionary.cart.empty}</p>
        <Link
          href={localePath(locale, "/#catalogue")}
          onClick={close}
          className="mt-6 inline-block bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
        >
          {dictionary.shopTheBasics}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="flex-1 overflow-y-auto px-gutter" aria-busy={isPending}>
        {lines.map((line) => (
          <CartLineItem key={line.id} line={line} onQuantity={changeQuantity} onNavigate={close} />
        ))}
      </ul>
      <div className="bg-surface px-gutter pt-5 pb-6">
        {notice && (
          <p role="status" className="mb-4">
            {notice}
          </p>
        )}
        <dl className="flex items-baseline justify-between text-lead">
          <dt>{dictionary.cart.subtotal}</dt>
          <dd className={`tabular-nums ${isPending ? "opacity-50" : ""}`}>
            {formatMoney(subtotal(lines, cart.cost.subtotalAmount.currencyCode))}
          </dd>
        </dl>
        <p className="mt-1 text-small text-muted">{dictionary.cart.taxesAtCheckout}</p>
        <a
          href={cart.checkoutUrl}
          aria-disabled={isPending}
          className="mt-5 block bg-accent px-6 py-4 text-center font-medium text-accent-ink transition-colors hover:bg-accent-strong active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-60"
        >
          {dictionary.cart.checkOut}
        </a>
      </div>
    </>
  );
}

function CartLineItem({
  line,
  onQuantity,
  onNavigate,
}: {
  line: CartLine;
  onQuantity: (lineId: string, quantity: number) => void;
  onNavigate: () => void;
}) {
  const { locale, dictionary } = useI18n();
  const words = dictionary.cart;
  const { product, image, selectedOptions } = line.merchandise;
  // The same slugs the product page reads, e.g. ?color=heather-grey&size=m.
  const params = selectionToParams(
    Object.fromEntries(selectedOptions.map((option) => [option.name, option.value])),
  );
  const label = selectedOptions.map((option) => option.value).join(" · ");

  return (
    <li className="flex gap-4 py-4">
      <div className="relative aspect-[4/5] w-24 shrink-0 bg-oatmeal">
        {image && (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="96px"
            className="object-cover mix-blend-multiply"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={`${localePath(locale, `/products/${product.handle}`)}?${params}`}
            onClick={onNavigate}
            className="font-medium underline-offset-4 hover:underline"
          >
            {product.title}
          </Link>
          <p className="shrink-0 tabular-nums">{formatMoney(line.cost.totalAmount)}</p>
        </div>
        <p className="text-small text-muted">{label}</p>
        <div className="mt-auto flex items-center gap-1">
          <QuantityButton
            label={format(words.oneFewer, { title: product.title })}
            onClick={() => onQuantity(line.id, line.quantity - 1)}
          >
            −
          </QuantityButton>
          <span className="w-8 text-center tabular-nums">
            <span className="sr-only">{words.quantity} </span>
            {line.quantity}
          </span>
          <QuantityButton
            label={format(words.oneMore, { title: product.title })}
            onClick={() => onQuantity(line.id, line.quantity + 1)}
          >
            +
          </QuantityButton>
          <button
            type="button"
            onClick={() => onQuantity(line.id, 0)}
            className="ml-auto text-small text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {words.remove}
          </button>
        </div>
      </div>
    </li>
  );
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="size-9 bg-surface text-lead leading-none transition-colors hover:bg-stone active:scale-95"
    >
      {children}
    </button>
  );
}

/** Scales the line total with the quantity, so an optimistic change shows the right price. */
function withQuantity(line: CartLine, quantity: number): CartLine {
  const unit = Number(line.cost.totalAmount.amount) / line.quantity;
  const amount = (unit * quantity).toFixed(2);
  return { ...line, quantity, cost: { totalAmount: { ...line.cost.totalAmount, amount } } };
}

function subtotal(lines: CartLine[], currencyCode: string) {
  const amount = lines.reduce((sum, line) => sum + Number(line.cost.totalAmount.amount), 0);
  return { amount: amount.toFixed(2), currencyCode };
}
