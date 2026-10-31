// A query appends every fragment it spreads exactly once: GraphQL rejects duplicate fragment names.

export const IMAGE_FRAGMENT = `#graphql
  fragment Image on Image {
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
`;

/** Spreads Image and Money. */
export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    handle
    title
    availableForSale
    images(first: 3) {
      nodes {
        ...Image
      }
    }
    priceRange {
      minVariantPrice {
        ...Money
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        ...Money
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    fabric: metafield(namespace: "everhem", key: "fabric") {
      value
    }
    featured: metafield(namespace: "everhem", key: "featured") {
      value
    }
  }
`;

/** Spreads Image and Money. */
export const CART_FRAGMENT = `#graphql
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        ...Money
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            ...Money
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              ...Image
            }
            product {
              handle
              title
            }
          }
        }
      }
    }
  }
`;
