import { collections } from "../../catalog/collections.ts";
import { checksum } from "../catalog/checksum.ts";
import type { CatalogCollection } from "../catalog/types.ts";
import { CHECKSUM_METAFIELD, SEED_VERSION } from "../constants.ts";
import { NotOwnedError, type Outcome, type RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";
import type { Store } from "./preflight.ts";
import { publishEverywhere } from "./publish.ts";

export const COLLECTION_BY_HANDLE = `#graphql
  query CollectionByHandle($handle: String!, $namespace: String!, $key: String!) {
    collectionByIdentifier(identifier: { handle: $handle }) {
      id
      seedChecksum: metafield(namespace: $namespace, key: $key) {
        value
      }
      resourcePublicationsV2(first: 25) {
        nodes {
          publication {
            id
          }
        }
      }
    }
  }
`;

const CREATE_COLLECTION = `#graphql
  mutation CreateCollection($collection: CollectionCreateInput!) {
    collectionCreate(collection: $collection) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_COLLECTION = `#graphql
  mutation UpdateCollection($collection: CollectionUpdateInput!) {
    collectionUpdate(collection: $collection) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface CollectionSync {
  outcomes: Outcome[];
  /** Collection ids by handle. Missing in a dry run for collections that do not exist yet. */
  ids: Map<string, string>;
}

/** Manual collections. Products join them through productSet, so no rules to keep in sync. */
export async function syncCollections(ctx: RunContext, store: Store): Promise<CollectionSync> {
  const result: CollectionSync = { outcomes: [], ids: new Map() };
  for (const collection of collections) {
    const { action, id } = await syncCollection(ctx, store, collection);
    result.outcomes.push({ resource: "collection", handle: collection.handle, action });
    if (id) result.ids.set(collection.handle, id);
  }
  return result;
}

async function syncCollection(ctx: RunContext, store: Store, collection: CatalogCollection) {
  const { client, logger, dryRun } = ctx;
  const { collectionByIdentifier: existing } = await client.request(COLLECTION_BY_HANDLE, {
    handle: collection.handle,
    namespace: CHECKSUM_METAFIELD.namespace,
    key: CHECKSUM_METAFIELD.key,
  });
  if (existing && !existing.seedChecksum) throw new NotOwnedError("collection", collection.handle);

  const sum = checksum({ version: SEED_VERSION, collection });
  const fields = {
    title: collection.title,
    handle: collection.handle,
    descriptionHtml: collection.descriptionHtml,
    metafields: [{ ...CHECKSUM_METAFIELD, value: sum }],
  };

  let id = existing?.id;
  let action: Outcome["action"];
  if (existing?.seedChecksum?.value === sum) {
    action = "skipped";
  } else if (dryRun) {
    action = existing ? "would-update" : "would-create";
  } else if (existing) {
    const { collectionUpdate } = await client.request(UPDATE_COLLECTION, {
      collection: { id: existing.id, ...fields },
    });
    assertNoUserErrors(`update collection ${collection.handle}`, collectionUpdate?.userErrors);
    action = "updated";
  } else {
    const { collectionCreate } = await client.request(CREATE_COLLECTION, { collection: fields });
    assertNoUserErrors(`create collection ${collection.handle}`, collectionCreate?.userErrors);
    id = collectionCreate?.collection?.id;
    if (!id) throw new Error(`collectionCreate returned no id for ${collection.handle}`);
    action = "created";
  }

  logger.info(`collection.${action}`, { handle: collection.handle, id });
  if (id) {
    const publishedIds =
      existing?.resourcePublicationsV2.nodes.map((node) => node.publication.id) ?? [];
    await publishEverywhere(
      ctx,
      store,
      { id, kind: "collection", handle: collection.handle },
      publishedIds,
    );
  }
  return { action, id };
}
