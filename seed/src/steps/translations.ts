import { collections } from "../../catalog/collections.ts";
import { colors } from "../../catalog/colors.ts";
import { products } from "../../catalog/products.ts";
import {
  planTranslations,
  wantedCollectionTranslations,
  wantedProductTranslations,
  type WantedTranslations,
} from "../catalog/translations.ts";
import { TRANSLATED_LOCALES, type TranslatedLocale } from "../catalog/types.ts";
import { CHECKSUM_METAFIELD, PRODUCT_METAFIELDS } from "../constants.ts";
import type { Outcome, RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";
import { mapPool } from "../util/pool.ts";
import { COLLECTION_BY_HANDLE } from "./collections.ts";

const PRODUCT_TRANSLATION_SOURCES = `#graphql
  query ProductTranslationSources(
    $handle: String!
    $namespace: String!
    $fabricKey: String!
    $careKey: String!
  ) {
    productByIdentifier(identifier: { handle: $handle }) {
      id
      options {
        name
        optionValues {
          id
          name
        }
      }
      fabric: metafield(namespace: $namespace, key: $fabricKey) {
        id
      }
      care: metafield(namespace: $namespace, key: $careKey) {
        id
      }
      media(first: 20) {
        nodes {
          id
          alt
        }
      }
    }
  }
`;

const TRANSLATABLE_RESOURCES = `#graphql
  query TranslatableResources($ids: [ID!]!, $first: Int!, $locale: String!) {
    translatableResourcesByIds(resourceIds: $ids, first: $first) {
      nodes {
        resourceId
        translatableContent {
          key
          digest
        }
        translations(locale: $locale) {
          key
          value
          outdated
        }
      }
    }
  }
`;

const REGISTER_TRANSLATIONS = `#graphql
  mutation RegisterTranslations($resourceId: ID!, $translations: [TranslationInput!]!) {
    translationsRegister(resourceId: $resourceId, translations: $translations) {
      translations {
        key
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

/**
 * Writes the catalog's translations: products, their colours, fabric, care and image alt text,
 * and collections. Runs after the products, because a translation is tied to the English text it
 * translates through a digest of it.
 */
export async function syncTranslations(ctx: RunContext, concurrency: number): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  for (const locale of TRANSLATED_LOCALES) {
    for (const collection of collections) {
      const { collectionByIdentifier } = await ctx.client.request(COLLECTION_BY_HANDLE, {
        handle: collection.handle,
        namespace: CHECKSUM_METAFIELD.namespace,
        key: CHECKSUM_METAFIELD.key,
      });
      const wanted = collectionByIdentifier
        ? wantedCollectionTranslations(collection, collectionByIdentifier.id, locale)
        : null;
      outcomes.push(await sync(ctx, locale, collection.handle, wanted));
    }

    outcomes.push(
      ...(await mapPool(products, concurrency, async (product) => {
        const { productByIdentifier } = await ctx.client.request(PRODUCT_TRANSLATION_SOURCES, {
          handle: product.handle,
          namespace: PRODUCT_METAFIELDS.fabric.namespace,
          fabricKey: PRODUCT_METAFIELDS.fabric.key,
          careKey: PRODUCT_METAFIELDS.care.key,
        });
        const wanted = productByIdentifier
          ? wantedProductTranslations(product, productByIdentifier, colors, locale)
          : null;
        return sync(ctx, locale, product.handle, wanted);
      })),
    );
  }
  return outcomes;
}

/** Without wanted translations the resource doesn't exist yet, which only happens in a dry run. */
async function sync(
  { client, logger, dryRun }: RunContext,
  locale: TranslatedLocale,
  handle: string,
  wanted: WantedTranslations | null,
): Promise<Outcome> {
  const outcome = (action: Outcome["action"]): Outcome => ({
    resource: "translation",
    handle: `${locale}/${handle}`,
    action,
  });
  if (!wanted) {
    logger.info("translation.would-create", { locale, handle });
    return outcome("would-create");
  }

  const ids = [...wanted.keys()];
  const { translatableResourcesByIds } = await client.request(TRANSLATABLE_RESOURCES, {
    ids,
    first: ids.length,
    locale,
  });
  const plan = planTranslations(wanted, translatableResourcesByIds.nodes, locale);
  if (plan.unsupported.length > 0) {
    logger.warn("translation.unsupported", { locale, handle, keys: plan.unsupported });
  }

  const keys = [...plan.register.values()].reduce((sum, inputs) => sum + inputs.length, 0);
  const action: Outcome["action"] =
    keys === 0
      ? "skipped"
      : dryRun
        ? plan.existed
          ? "would-update"
          : "would-create"
        : plan.existed
          ? "updated"
          : "created";

  if (!dryRun) {
    for (const [resourceId, translations] of plan.register) {
      const { translationsRegister } = await client.request(REGISTER_TRANSLATIONS, {
        resourceId,
        translations,
      });
      assertNoUserErrors(`translate ${resourceId} to ${locale}`, translationsRegister?.userErrors);
    }
  }

  logger.info(`translation.${action}`, { locale, handle, keys });
  return outcome(action);
}
