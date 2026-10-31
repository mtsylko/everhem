export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

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
  "tee" | "long-sleeve" | "hoodie" | "zip-hoodie" | "sweater" | "cardigan" | "turtleneck";

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
  /** Short code used in SKUs, e.g. ECT. */
  code: string;
  price: string;
  compareAtPrice?: string;
  colors: readonly string[];
  stock: StockPlan;
  /** Puts the product in the storefront's double tiles, labelled with the reason. */
  featured?: FeatureReason;
  tags?: readonly string[];
  /** Overrides the default local images, e.g. with remote URLs. */
  images?: readonly CatalogImage[];
  translations: Translated<ProductText>;
}
