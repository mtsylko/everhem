import "server-only";
import { languageCode, type Locale } from "@/i18n/locales";
import { storefront, type RequestOptions } from "./client";
import { CART_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT } from "./fragments";

const CART_QUERY = `#graphql
  query Cart($cartId: ID!, $language: LanguageCode) @inContext(language: $language) {
    cart(id: $cartId) {
      ...Cart
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const CART_CREATE = `#graphql
  mutation CartCreate($lines: [CartLineInput!]!, $language: LanguageCode)
  @inContext(language: $language) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...Cart
      }
      userErrors {
        message
      }
      warnings {
        message
      }
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const CART_LINES_ADD = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $language: LanguageCode)
  @inContext(language: $language) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        message
      }
      warnings {
        message
      }
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const CART_LINES_UPDATE = `#graphql
  mutation CartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        message
      }
      warnings {
        message
      }
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const CART_LINES_REMOVE = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $language: LanguageCode)
  @inContext(language: $language) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...Cart
      }
      userErrors {
        message
      }
      warnings {
        message
      }
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

export interface CartRequestOptions extends RequestOptions {
  /** Shopify answers in this language, and a new cart's checkout opens in it. */
  locale: Locale;
}

interface CartPayload<C> {
  cart?: C | null;
  userErrors: readonly { message: string }[];
  warnings: readonly { message: string }[];
}

export interface CartMutationResult<C> {
  cart: C | null;
  /** A message for the shopper, e.g. when Shopify capped a quantity at the stock level. */
  notice: string | null;
}

/** Mutations report problems in userErrors and warnings with HTTP 200, so we check them by hand. */
function unwrap<C>(payload: CartPayload<C> | null | undefined): CartMutationResult<C> {
  const notice = [...(payload?.userErrors ?? []), ...(payload?.warnings ?? [])][0]?.message;
  return { cart: payload?.cart ?? null, notice: notice ?? null };
}

export async function fetchCart(cartId: string, options: CartRequestOptions) {
  const { cart } = await storefront(
    CART_QUERY,
    { cartId, language: languageCode(options.locale) },
    options,
  );
  return cart ?? null;
}

export type Cart = NonNullable<Awaited<ReturnType<typeof fetchCart>>>;
export type CartLine = Cart["lines"]["nodes"][number];

export async function createCart(
  merchandiseId: string,
  quantity: number,
  options: CartRequestOptions,
) {
  const { cartCreate } = await storefront(
    CART_CREATE,
    { lines: [{ merchandiseId, quantity }], language: languageCode(options.locale) },
    options,
  );
  return unwrap(cartCreate);
}

export async function addCartLines(
  cartId: string,
  merchandiseId: string,
  quantity: number,
  options: CartRequestOptions,
) {
  const { cartLinesAdd } = await storefront(
    CART_LINES_ADD,
    { cartId, lines: [{ merchandiseId, quantity }], language: languageCode(options.locale) },
    options,
  );
  return unwrap(cartLinesAdd);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
  options: CartRequestOptions,
) {
  const { cartLinesUpdate } = await storefront(
    CART_LINES_UPDATE,
    { cartId, lines: [{ id: lineId, quantity }], language: languageCode(options.locale) },
    options,
  );
  return unwrap(cartLinesUpdate);
}

export async function removeCartLine(cartId: string, lineId: string, options: CartRequestOptions) {
  const { cartLinesRemove } = await storefront(
    CART_LINES_REMOVE,
    { cartId, lineIds: [lineId], language: languageCode(options.locale) },
    options,
  );
  return unwrap(cartLinesRemove);
}
