import { fileURLToPath } from "node:url";
import { collections } from "../catalog/collections.ts";
import { colors } from "../catalog/colors.ts";
import { products } from "../catalog/products.ts";
import { validateCatalog } from "./catalog/validate.ts";
import type { Outcome, RunContext } from "./outcome.ts";
import { syncCollections } from "./steps/collections.ts";
import { ensureLocales } from "./steps/locales.ts";
import { ensureMetafieldDefinitions } from "./steps/metafield-definitions.ts";
import { preflight } from "./steps/preflight.ts";
import { syncProduct } from "./steps/products.ts";
import { syncTranslations } from "./steps/translations.ts";
import { mapPool } from "./util/pool.ts";

const IMAGES_DIR = fileURLToPath(new URL("../catalog/images", import.meta.url));

export interface SeedOptions {
  /** Products synced in parallel. The cost limiter keeps them inside the rate limit. */
  concurrency: number;
}

export async function seed(ctx: RunContext, { concurrency }: SeedOptions): Promise<Outcome[]> {
  const problems = validateCatalog(products, collections, colors);
  if (problems.length > 0) throw new Error(`Catalog is invalid:\n- ${problems.join("\n- ")}`);

  const store = await preflight(ctx);
  const locales = await ensureLocales(ctx);
  const definitions = await ensureMetafieldDefinitions(ctx);
  const { outcomes: collectionOutcomes, ids } = await syncCollections(ctx, store);
  const productOutcomes = await mapPool(products, concurrency, (product) =>
    syncProduct(ctx, store, product, ids, IMAGES_DIR),
  );

  const translations = await syncTranslations(ctx, concurrency);

  return [...locales, ...definitions, ...collectionOutcomes, ...productOutcomes, ...translations];
}
