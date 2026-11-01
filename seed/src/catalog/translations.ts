import type { TranslationInput } from "../../generated/admin.types.js";
import { planImages, translatedAlt } from "./images.ts";
import {
  ONE_SIZE,
  type CatalogCollection,
  type CatalogProduct,
  type Color,
  type Translated,
  type TranslatedLocale,
} from "./types.ts";

/** Size names that read differently in another language. XS to XL read the same everywhere. */
const SIZE_NAMES: Translated<Readonly<Record<string, string>>> = {
  pl: { [ONE_SIZE]: "Rozmiar uniwersalny" },
};

/** Translated values to have in the store, by resource id, then by translatable key. */
export type WantedTranslations = ReadonlyMap<string, Readonly<Record<string, string>>>;

/** A product's translatable parts, as the store has them. */
export interface ProductSources {
  id: string;
  options: readonly { name: string; optionValues: readonly { id: string; name: string }[] }[];
  fabric?: { id: string } | null;
  care?: { id: string } | null;
  media: { nodes: readonly { id: string; alt?: string | null }[] };
}

/** What translatableResourcesByIds returns for one resource. */
export interface TranslatableResource {
  resourceId: string;
  translatableContent: readonly { key: string; digest?: string | null }[];
  translations: readonly { key: string; value?: string | null; outdated: boolean }[];
}

export interface TranslationPlan {
  /** Translations to register, by resource id. Unchanged ones are left out. */
  register: Map<string, TranslationInput[]>;
  /** Wanted keys the store doesn't offer for translation, as "resourceId key". */
  unsupported: string[];
  /** Whether some wanted translation exists already, which makes a change an update. */
  existed: boolean;
}

/**
 * Everything a shopper reads on a product: its title and description, colour and size names,
 * fabric and care, and image alt text. Option names stay in English: the storefront matches on
 * "Color".
 */
export function wantedProductTranslations(
  product: CatalogProduct,
  sources: ProductSources,
  palette: ReadonlyMap<string, Color>,
  locale: TranslatedLocale,
): WantedTranslations {
  const text = product.translations[locale];
  const wanted = new Map<string, Record<string, string>>([
    [sources.id, { title: text.title, body_html: text.descriptionHtml }],
  ]);

  const colors = sources.options.find((option) => option.name === "Color");
  for (const value of colors?.optionValues ?? []) {
    const name = palette.get(value.name)?.translations[locale];
    if (name) wanted.set(value.id, { name });
  }
  const sizes = sources.options.find((option) => option.name === "Size");
  for (const value of sizes?.optionValues ?? []) {
    const name = SIZE_NAMES[locale][value.name];
    if (name) wanted.set(value.id, { name });
  }

  if (sources.fabric) wanted.set(sources.fabric.id, { value: text.fabric });
  // A list metafield holds a JSON array, and so does its translation.
  if (sources.care) wanted.set(sources.care.id, { value: JSON.stringify(text.care) });

  // Images are matched by their English alt text, which the seed wrote.
  const images = planImages(product, "");
  for (const media of sources.media.nodes) {
    const image = images.find((planned) => planned.alt === media.alt);
    if (image) wanted.set(media.id, { alt: translatedAlt(product, image, palette, locale) });
  }
  return wanted;
}

export function wantedCollectionTranslations(
  collection: CatalogCollection,
  id: string,
  locale: TranslatedLocale,
): WantedTranslations {
  const text = collection.translations[locale];
  return new Map([[id, { title: text.title, body_html: text.descriptionHtml }]]);
}

/**
 * Compares wanted translations with the store's. A translation is registered again when its value
 * differs, or when Shopify marks it outdated because the English text changed since.
 */
export function planTranslations(
  wanted: WantedTranslations,
  resources: readonly TranslatableResource[],
  locale: TranslatedLocale,
): TranslationPlan {
  const plan: TranslationPlan = { register: new Map(), unsupported: [], existed: false };

  for (const [resourceId, values] of wanted) {
    const resource = resources.find((r) => r.resourceId === resourceId);
    const inputs: TranslationInput[] = [];

    for (const [key, value] of Object.entries(values)) {
      const digest = resource?.translatableContent.find((content) => content.key === key)?.digest;
      if (!digest) {
        plan.unsupported.push(`${resourceId} ${key}`);
        continue;
      }
      const current = resource?.translations.find((translation) => translation.key === key);
      if (current) plan.existed = true;
      if (current?.value === value && !current.outdated) continue;
      inputs.push({ locale, key, value, translatableContentDigest: digest });
    }

    if (inputs.length > 0) plan.register.set(resourceId, inputs);
  }
  return plan;
}
