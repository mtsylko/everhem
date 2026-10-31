import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getLocale } from "@/i18n/server";
import { languageCode } from "@/i18n/locales";
import { storefront } from "./client";
import { IMAGE_FRAGMENT, MONEY_FRAGMENT, PRODUCT_CARD_FRAGMENT } from "./fragments";

/**
 * Catalog reads run in the page's language: Shopify answers with its translations, and falls back
 * to English where there are none. The locale comes from the URL, so it is part of every cache key.
 */
async function language() {
  return languageCode(await getLocale());
}

/** One tag for the whole catalog: it is small, and one webhook can refresh all of it. */
export const CATALOG_TAG = "catalog";

/** Shopify creates "frontpage" for the Online Store theme's home page; it isn't one of our ranges. */
const HIDDEN_COLLECTIONS = new Set(["frontpage"]);

function isListed(collection: { handle: string }): boolean {
  return !HIDDEN_COLLECTIONS.has(collection.handle);
}

const COLLECTIONS_QUERY = `#graphql
  query Collections($language: LanguageCode) @inContext(language: $language) {
    collections(first: 20, sortKey: ID) {
      nodes {
        handle
        title
        description
        products(first: 50) {
          nodes {
            featuredImage {
              ...Image
            }
            priceRange {
              minVariantPrice {
                ...Money
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $sortKey: ProductSortKeys, $language: LanguageCode)
  @inContext(language: $language) {
    products(first: $first, sortKey: $sortKey) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const COLLECTION_QUERY = `#graphql
  query Collection($handle: String!, $language: LanguageCode)
  @inContext(language: $language) {
    collection(handle: $handle) {
      handle
      title
      description
      descriptionHtml
      seo {
        title
        description
      }
      products(first: 100, sortKey: COLLECTION_DEFAULT) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!, $language: LanguageCode) @inContext(language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      seo {
        title
        description
      }
      images(first: 20) {
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
          swatch {
            color
          }
        }
      }
      variants(first: 100) {
        nodes {
          id
          sku
          availableForSale
          selectedOptions {
            name
            value
          }
          image {
            ...Image
          }
          price {
            ...Money
          }
          compareAtPrice {
            ...Money
          }
        }
      }
      fabric: metafield(namespace: "everhem", key: "fabric") {
        value
      }
      care: metafield(namespace: "everhem", key: "care") {
        value
      }
      collections(first: 5) {
        nodes {
          handle
          title
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const COLOUR_INDEX_QUERY = `#graphql
  query ColourIndex($language: LanguageCode) @inContext(language: $language) {
    products(first: 50, sortKey: BEST_SELLING) {
      nodes {
        handle
        title
        variants(first: 100) {
          nodes {
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              ...Image
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;

const PRODUCT_HANDLES_QUERY = `#graphql
  query ProductHandles {
    products(first: 250) {
      nodes {
        handle
        updatedAt
      }
    }
  }
`;

export async function getCollections() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { collections } = await storefront(COLLECTIONS_QUERY, { language: await language() });
  return collections.nodes.filter(isListed);
}

export async function getProducts(sortKey: "BEST_SELLING" | "CREATED_AT" = "BEST_SELLING") {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { products } = await storefront(PRODUCTS_QUERY, {
    first: 50,
    sortKey,
    language: await language(),
  });
  return products.nodes;
}

export async function getCollection(handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { collection } = await storefront(COLLECTION_QUERY, { handle, language: await language() });
  return collection && isListed(collection) ? collection : null;
}

export async function getProduct(handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { product } = await storefront(PRODUCT_QUERY, { handle, language: await language() });
  if (!product) return null;
  return { ...product, collections: { nodes: product.collections.nodes.filter(isListed) } };
}

export async function getColourIndex() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { products } = await storefront(COLOUR_INDEX_QUERY, { language: await language() });
  return products.nodes;
}

export async function getProductHandles() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { products } = await storefront(PRODUCT_HANDLES_QUERY);
  return products.nodes;
}
