import "server-only";
import { storefront, type RequestOptions } from "./client";
import { CART_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT } from "./fragments";

const CART_QUERY = `#graphql
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      ...Cart
    }
  }
  ${CART_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const CART_CREATE = `#graphql
  mutation CartCreate($lines: [CartLineInput!]!) {
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
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
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
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
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
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
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

export async function fetchCart(cartId: string, options?: RequestOptions) {
  const { cart } = await storefront(CART_QUERY, { cartId }, options);
  return cart ?? null;
}

export type Cart = NonNullable<Awaited<ReturnType<typeof fetchCart>>>;
export type CartLine = Cart["lines"]["nodes"][number];

export async function createCart(
  merchandiseId: string,
  quantity: number,
  options?: RequestOptions,
) {
  const { cartCreate } = await storefront(
    CART_CREATE,
    { lines: [{ merchandiseId, quantity }] },
    options,
  );
  return unwrap(cartCreate);
}

export async function addCartLines(
  cartId: string,
  merchandiseId: string,
  quantity: number,
  options?: RequestOptions,
) {
  const { cartLinesAdd } = await storefront(
    CART_LINES_ADD,
    { cartId, lines: [{ merchandiseId, quantity }] },
    options,
  );
  return unwrap(cartLinesAdd);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
  options?: RequestOptions,
) {
  const { cartLinesUpdate } = await storefront(
    CART_LINES_UPDATE,
    { cartId, lines: [{ id: lineId, quantity }] },
    options,
  );
  return unwrap(cartLinesUpdate);
}

export async function removeCartLine(cartId: string, lineId: string, options?: RequestOptions) {
  const { cartLinesRemove } = await storefront(
    CART_LINES_REMOVE,
    { cartId, lineIds: [lineId] },
    options,
  );
  return unwrap(cartLinesRemove);
}
