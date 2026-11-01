import { IMAGES_PER_PRODUCT, planImages } from "./images.ts";
import type { CatalogCollection, CatalogProduct, Color } from "./types.ts";
import { planVariants } from "./variants.ts";

const PRICE = /^\d+\.\d{2}$/;

/** Catches catalog mistakes before any request is sent. Returns a list of problems. */
export function validateCatalog(
  products: readonly CatalogProduct[],
  collections: readonly CatalogCollection[],
  palette: ReadonlyMap<string, Color>,
): string[] {
  const collectionHandles = collections.map((c) => c.handle);
  const automatic = collections.filter((c) => c.conditions).map((c) => c.handle);
  const productHandles = products.map((p) => p.handle);
  const productCodes = products.map((p) => p.code);
  const errors = [
    ...duplicates("collection handle", collectionHandles),
    ...duplicates("product handle", productHandles),
    ...duplicates("product code", productCodes),
  ];

  for (const product of products) {
    const at = (message: string) => errors.push(`${product.handle}: ${message}`);

    if (!collectionHandles.includes(product.collection)) {
      at(`unknown collection "${product.collection}"`);
    } else if (automatic.includes(product.collection)) {
      at(`collection "${product.collection}" picks its products by conditions`);
    }
    for (const color of product.colors) {
      if (!palette.has(color)) at(`unknown color "${color}"`);
    }
    errors.push(...duplicates(`color in ${product.handle}`, product.colors));

    if (!PRICE.test(product.price)) at(`price "${product.price}" must look like 79.00`);
    if (product.compareAtPrice !== undefined) {
      if (!PRICE.test(product.compareAtPrice)) at(`compare-at price must look like 99.00`);
      else if (Number(product.compareAtPrice) <= Number(product.price)) {
        at("compare-at price must be higher than the price");
      }
    }

    if (product.stock.kind === "in-stock") {
      for (const { color } of product.stock.soldOut ?? []) {
        if (!product.colors.includes(color)) at(`sold-out color "${color}" is not a product color`);
      }
    }

    const imageCount = planImages(product, "").length;
    if (imageCount !== IMAGES_PER_PRODUCT) {
      at(`has ${imageCount} images, expected ${IMAGES_PER_PRODUCT}`);
    }
  }

  const knownColors = products.filter((p) => p.colors.every((color) => palette.has(color)));
  const skus = knownColors.flatMap((p) => planVariants(p, palette).map((v) => v.sku));
  errors.push(...duplicates("SKU", skus));

  return errors;
}

function duplicates(label: string, values: readonly string[]): string[] {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) reported.add(value);
    seen.add(value);
  }
  return [...reported].map((value) => `duplicate ${label} "${value}"`);
}
