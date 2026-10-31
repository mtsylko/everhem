import type { FileSetInput, ProductSetInput } from "../../generated/admin.types.js";
import {
  CHECKSUM_METAFIELD,
  PRODUCT_METAFIELDS,
  SEED_TAG,
  SEED_VERSION,
  VENDOR,
} from "../constants.ts";
import { checksum } from "./checksum.ts";
import { variantImageFor, type PlannedImage } from "./images.ts";
import { SIZES, type CatalogProduct, type Color } from "./types.ts";
import { planVariants, variantKey } from "./variants.ts";

export interface ResolvedImage extends PlannedImage {
  /** A public URL or a staged upload URL that Shopify can fetch. */
  originalSource: string;
}

export interface ProductInputContext {
  palette: ReadonlyMap<string, Color>;
  locationId: string;
  collectionId: string;
  images: readonly ResolvedImage[];
  /** Reusing ids keeps existing variants instead of replacing them. */
  existingVariantIds: ReadonlyMap<string, string>;
  checksum: string;
}

/** Changes whenever anything that ends up in the product input changes. */
export function productChecksum(
  product: CatalogProduct,
  collectionId: string,
  imageHashes: Readonly<Record<string, string>>,
): string {
  return checksum({ version: SEED_VERSION, product, collectionId, imageHashes });
}

export function buildProductSetInput(
  product: CatalogProduct,
  ctx: ProductInputContext,
): ProductSetInput {
  const variants = planVariants(product, ctx.palette).map((variant, index) => {
    const image = variantImageFor(ctx.images, variant.color);
    return {
      id: ctx.existingVariantIds.get(variantKey(variant.color, variant.size)),
      position: index + 1,
      optionValues: [
        { optionName: "Color", name: variant.color },
        { optionName: "Size", name: variant.size },
      ],
      price: product.price,
      // null clears an old compare-at price when a sale ends.
      compareAtPrice: product.compareAtPrice ?? null,
      sku: variant.sku,
      inventoryPolicy: "DENY" as const,
      inventoryItem: { tracked: true },
      inventoryQuantities: [
        { locationId: ctx.locationId, name: "available", quantity: variant.quantity },
      ],
      file: image ? toFileInput(image) : undefined,
    };
  });

  return {
    handle: product.handle,
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    productType: product.productType,
    vendor: VENDOR,
    status: "ACTIVE",
    tags: [SEED_TAG, ...(product.tags ?? [])],
    collections: [ctx.collectionId],
    productOptions: [
      { name: "Color", position: 1, values: product.colors.map((name) => ({ name })) },
      { name: "Size", position: 2, values: SIZES.map((name) => ({ name })) },
    ],
    files: ctx.images.map(toFileInput),
    variants,
    metafields: [
      metafield(PRODUCT_METAFIELDS.fabric, product.fabric),
      metafield(PRODUCT_METAFIELDS.care, JSON.stringify(product.care)),
      // productSet deletes the metafields it isn't given, so leaving this out clears an old label.
      ...(product.featured ? [metafield(PRODUCT_METAFIELDS.featured, product.featured)] : []),
      metafield(CHECKSUM_METAFIELD, ctx.checksum),
    ],
  };
}

function toFileInput(image: ResolvedImage): FileSetInput {
  return {
    originalSource: image.originalSource,
    alt: image.alt,
    filename: image.filename,
    contentType: "IMAGE",
  };
}

function metafield(def: { namespace: string; key: string; type: string }, value: string) {
  return { namespace: def.namespace, key: def.key, type: def.type, value };
}
