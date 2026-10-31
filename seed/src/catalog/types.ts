export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

/** Why a product is featured. The storefront shows it as the product's label. */
export const FEATURE_REASONS = ["New", "Bestseller", "Staff pick"] as const;
export type FeatureReason = (typeof FEATURE_REASONS)[number];

export type Garment =
  "tee" | "long-sleeve" | "hoodie" | "zip-hoodie" | "sweater" | "cardigan" | "turtleneck";

export interface Color {
  name: string;
  /** Short code used in SKUs, e.g. BLK. */
  code: string;
  hex: string;
}

export interface CatalogCollection {
  handle: string;
  title: string;
  descriptionHtml: string;
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

export interface CatalogProduct {
  handle: string;
  title: string;
  collection: string;
  productType: string;
  garment: Garment;
  /** Short code used in SKUs, e.g. ECT. */
  code: string;
  price: string;
  compareAtPrice?: string;
  colors: readonly string[];
  descriptionHtml: string;
  fabric: string;
  care: readonly string[];
  stock: StockPlan;
  /** Puts the product in the storefront's double tiles, labelled with the reason. */
  featured?: FeatureReason;
  tags?: readonly string[];
  /** Overrides the default local images, e.g. with remote URLs. */
  images?: readonly CatalogImage[];
}
