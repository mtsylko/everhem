import { TRANSLATED_LOCALES } from "../catalog/types.ts";
import type { Outcome, RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";

const SHOP_LOCALES = `#graphql
  query ShopLocales {
    shopLocales {
      locale
      primary
      published
      marketWebPresences {
        id
      }
    }
  }
`;

const ENABLE_LOCALE = `#graphql
  mutation EnableShopLocale($locale: String!, $marketWebPresenceIds: [ID!]) {
    shopLocaleEnable(locale: $locale, marketWebPresenceIds: $marketWebPresenceIds) {
      shopLocale {
        locale
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_LOCALE = `#graphql
  mutation UpdateShopLocale($locale: String!, $shopLocale: ShopLocaleInput!) {
    shopLocaleUpdate(locale: $locale, shopLocale: $shopLocale) {
      shopLocale {
        locale
        published
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/** The catalog is written in English, so English has to be the language translations start from. */
const CATALOG_LOCALE = "en";

/**
 * Turns on every language the catalog is translated into. A language only reaches shoppers when it
 * is published and added to the markets that sell in the primary language: the Storefront API
 * falls back to English for a language that a market doesn't offer.
 */
export async function ensureLocales({ client, logger, dryRun }: RunContext): Promise<Outcome[]> {
  const { shopLocales } = await client.request(SHOP_LOCALES);
  const primary = shopLocales.find((shopLocale) => shopLocale.primary);
  if (primary?.locale !== CATALOG_LOCALE) {
    throw new Error(
      `The store's default language is ${primary?.locale ?? "unknown"}, but the catalog is in English. ` +
        "Make English the default language in the store settings first.",
    );
  }
  const markets = primary.marketWebPresences.map((presence) => presence.id);

  const outcomes: Outcome[] = [];
  for (const locale of TRANSLATED_LOCALES) {
    const existing = shopLocales.find((shopLocale) => shopLocale.locale === locale);
    const missingMarkets = markets.filter(
      (id) => !existing?.marketWebPresences.some((presence) => presence.id === id),
    );

    const action: Outcome["action"] = !existing
      ? dryRun
        ? "would-create"
        : "created"
      : existing.published && missingMarkets.length === 0
        ? "skipped"
        : dryRun
          ? "would-update"
          : "updated";

    if (action === "created") {
      const { shopLocaleEnable } = await client.request(ENABLE_LOCALE, {
        locale,
        marketWebPresenceIds: markets,
      });
      assertNoUserErrors(`enable locale ${locale}`, shopLocaleEnable?.userErrors);
    }
    if (action === "created" || action === "updated") {
      // A new locale starts unpublished, and publishing doesn't add it to markets by itself.
      const { shopLocaleUpdate } = await client.request(UPDATE_LOCALE, {
        locale,
        shopLocale: {
          published: true,
          marketWebPresenceIds: [
            ...new Set([...(existing?.marketWebPresences.map((p) => p.id) ?? []), ...markets]),
          ],
        },
      });
      assertNoUserErrors(`publish locale ${locale}`, shopLocaleUpdate?.userErrors);
    }

    logger.info(`locale.${action}`, { locale, markets: markets.length });
    outcomes.push({ resource: "locale", handle: locale, action });
  }
  return outcomes;
}
