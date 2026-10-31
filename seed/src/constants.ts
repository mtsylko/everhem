import type { MetafieldDefinitionValidationInput } from "../generated/admin.types.js";
import { FEATURE_REASONS } from "./catalog/types.ts";

/** Every product the seeder creates gets this tag. Teardown searches by it. */
export const SEED_TAG = "everhem-seed";

export const VENDOR = "Everhem";

/**
 * Holds a hash of the seed data for a product or collection.
 * Its presence also marks the resource as created by the seeder.
 */
export const CHECKSUM_METAFIELD = {
  namespace: "everhem_seed",
  key: "checksum",
  type: "single_line_text_field",
} as const;

export const PRODUCT_METAFIELDS = {
  fabric: {
    namespace: "everhem",
    key: "fabric",
    type: "single_line_text_field",
    name: "Fabric composition",
    description: "Fibre content and fabric weight, e.g. 100% organic cotton, 180 g/m² jersey.",
  },
  care: {
    namespace: "everhem",
    key: "care",
    type: "list.single_line_text_field",
    name: "Care instructions",
    description: "Washing and care steps, one per line.",
  },
  featured: {
    namespace: "everhem",
    key: "featured",
    type: "single_line_text_field",
    name: "Featured as",
    description:
      "Shows the product at double size in the storefront grid, labelled with this reason.",
    // The admin shows the choices as a dropdown, and Shopify rejects any other value.
    validations: [
      { name: "choices", value: JSON.stringify(FEATURE_REASONS) },
    ] as MetafieldDefinitionValidationInput[],
  },
} as const;

/** Bump to update every resource on the next run, e.g. after changing how inputs are built. */
export const SEED_VERSION = 1;

/** Write scopes include the matching read scopes. */
export const REQUIRED_SCOPES = [
  "write_products",
  "write_inventory",
  "read_locations",
  "write_publications",
  "write_files",
  "write_locales",
  "write_translations",
  // Lists the markets a new language is added to.
  "read_markets",
] as const;
