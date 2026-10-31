import { REQUIRED_SCOPES } from "../constants.ts";
import type { RunContext } from "../outcome.ts";

const PREFLIGHT = `#graphql
  query Preflight {
    shop {
      name
      myshopifyDomain
      currencyCode
    }
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
    locations(first: 25) {
      nodes {
        id
        name
        isActive
        fulfillsOnlineOrders
      }
    }
    publications(first: 25) {
      nodes {
        id
        catalog {
          title
          ... on AppCatalog {
            apps(first: 1) {
              nodes {
                title
              }
            }
          }
        }
      }
    }
  }
`;

export interface Publication {
  id: string;
  title: string;
}

export interface Store {
  name: string;
  locationId: string;
  publications: readonly Publication[];
}

const CATALOG_CURRENCY = "PLN";

/** Checks everything that would make the run fail halfway, before we change anything. */
export async function preflight({ client, logger }: RunContext): Promise<Store> {
  const { shop, currentAppInstallation, locations, publications } = await client.request(PREFLIGHT);

  const granted = currentAppInstallation.accessScopes.map((scope) => scope.handle);
  const missing = missingScopes(granted, REQUIRED_SCOPES);
  if (missing.length > 0) {
    throw new Error(
      `The app is missing access scopes: ${missing.join(", ")}. ` +
        "Add them to the app in the Dev Dashboard, release a new version and reinstall it.",
    );
  }

  if (shop.currencyCode !== CATALOG_CURRENCY) {
    throw new Error(
      `The store currency is ${shop.currencyCode}, but catalog prices are in ${CATALOG_CURRENCY}. ` +
        "Change the store currency in the store settings first.",
    );
  }

  const location = pickLocation(locations.nodes);
  if (!location) throw new Error("The store has no active location to hold inventory.");

  const store: Store = {
    name: shop.name,
    locationId: location.id,
    publications: publications.nodes.map((p) => ({ id: p.id, title: publicationTitle(p) })),
  };

  logger.info("preflight.ok", {
    shop: shop.myshopifyDomain,
    currency: shop.currencyCode,
    location: location.name,
    publications: store.publications.map((p) => p.title),
  });
  return store;
}

/** A channel's catalog title looks like "Channel Catalog 123 for Online Store", so prefer the app title. */
function publicationTitle(publication: {
  id: string;
  catalog?: { title: string; apps?: { nodes: ReadonlyArray<{ title: string }> } } | null;
}): string {
  const { catalog } = publication;
  return catalog?.apps?.nodes[0]?.title ?? catalog?.title ?? publication.id;
}

export function missingScopes(granted: readonly string[], required: readonly string[]): string[] {
  const have = new Set(granted);
  return required.filter(
    (scope) => !have.has(scope) && !have.has(scope.replace(/^read_/, "write_")),
  );
}

export function pickLocation<T extends { isActive: boolean; fulfillsOnlineOrders: boolean }>(
  locations: readonly T[],
): T | undefined {
  const active = locations.filter((location) => location.isActive);
  return active.find((location) => location.fulfillsOnlineOrders) ?? active[0];
}
