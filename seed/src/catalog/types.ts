import type { CollectionSourceInclusionConditionInput } from "../../generated/admin.types.js";

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
/** The size accessories come in. */
export const ONE_SIZE = "One size";
export type Size = (typeof SIZES)[number] | typeof ONE_SIZE;

/** Why a product is featured. The storefront shows it as the product's label. */
export const FEATURE_REASONS = ["New", "Bestseller", "Staff pick"] as const;
export type FeatureReason = (typeof FEATURE_REASONS)[number];

/**
 * Languages the catalog is translated into. English, the store's primary language, is the catalog
 * itself, so it isn't listed.
 */
export const TRANSLATED_LOCALES = ["pl"] as const;
export type TranslatedLocale = (typeof TRANSLATED_LOCALES)[number];

/** Text in every translated language, e.g. { pl: "Czarny" }. */
export type Translated<T> = Readonly<Record<TranslatedLocale, T>>;

export type Garment =
  | "tee"
  | "v-neck-tee"
  | "pocket-tee"
  | "tank"
  | "polo"
  | "henley"
  | "long-sleeve"
  | "sweatshirt"
  | "quarter-zip"
  | "hoodie"
  | "zip-hoodie"
  | "sweater"
  | "v-neck-sweater"
  | "cardigan"
  | "turtleneck"
  | "vest"
  | "beanie"
  | "scarf"
  | "socks"
  | "tote";

/** The cut the placeholder image draws: how wide, how long, and where the shoulder sits. */
export type Fit = "regular" | "slim" | "relaxed" | "boxy" | "oversized";

/** The fabric surface the placeholder image draws. */
export type Texture =
  | "jersey"
  | "slub"
  | "pique"
  | "waffle"
  | "fleece"
  | "terry"
  | "fine-knit"
  | "brushed"
  | "rib-knit"
  | "cable"
  | "canvas";

export interface Color {
  name: string;
  /** Short code used in SKUs, e.g. BLK. */
  code: string;
  hex: string;
  translations: Translated<string>;
}

export interface CollectionText {
  title: string;
  descriptionHtml: string;
}

export interface CatalogCollection extends CollectionText {
  handle: string;
  /**
   * Lets Shopify pick the products: every product that matches all the conditions joins, so no
   * product names this collection. They are set when the seed creates the collection; the seed
   * leaves an existing collection's conditions alone.
   */
  conditions?: readonly CollectionSourceInclusionConditionInput[];
  translations: Translated<CollectionText>;
}

export type StockPlan =
  | { kind: "in-stock"; soldOut?: ReadonlyArray<{ color: string; size: Size }> }
  | { kind: "sold-out" };

export type ImageView = "front" | "back";

export type ImageSource = { kind: "file"; path: string } | { kind: "url"; url: string };

export interface CatalogImage {
  color: string;
  view: ImageView;
  source: ImageSource;
}

/** The parts of a product a shopper reads. */
export interface ProductText {
  title: string;
  descriptionHtml: string;
  fabric: string;
  care: readonly string[];
}

export interface CatalogProduct extends ProductText {
  handle: string;
  collection: string;
  productType: string;
  garment: Garment;
  fit: Fit;
  texture: Texture;
  /** Short code used in SKUs, e.g. ECT. */
  code: string;
  price: string;
  compareAtPrice?: string;
  colors: readonly string[];
  /** The sizes it comes in, XS to XL when left out. */
  sizes?: readonly Size[];
  stock: StockPlan;
  /** Puts the product in the storefront's double tiles, labelled with the reason. */
  featured?: FeatureReason;
  tags?: readonly string[];
  /** Overrides the default local images, e.g. with remote URLs. */
  images?: readonly CatalogImage[];
  translations: Translated<ProductText>;
}
