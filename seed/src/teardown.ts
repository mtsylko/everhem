import { collections } from "../catalog/collections.ts";
import { products as catalogProducts } from "../catalog/products.ts";
import { CHECKSUM_METAFIELD, PRODUCT_METAFIELDS, SEED_TAG } from "./constants.ts";
import type { SeededProductsQuery } from "../generated/admin.generated.js";
import type { Outcome, RunContext } from "./outcome.ts";
import { assertNoUserErrors } from "./shopify/errors.ts";
import { COLLECTION_BY_HANDLE } from "./steps/collections.ts";
import { PRODUCT_METAFIELD_DEFINITIONS } from "./steps/metafield-definitions.ts";
import { PRODUCT_BY_HANDLE } from "./steps/products.ts";
import { DELETE_WEBHOOK, isRevalidation, WEBHOOK_SUBSCRIPTIONS } from "./steps/webhooks.ts";

const SEEDED_PRODUCTS = `#graphql
  query SeededProducts($query: String!, $after: String, $namespace: String!, $key: String!) {
    products(first: 50, after: $after, query: $query) {
      nodes {
        id
        handle
        tags
        seedChecksum: metafield(namespace: $namespace, key: $key) {
          value
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const DELETE_PRODUCT = `#graphql
  mutation DeleteProduct($id: ID!) {
    productDelete(input: { id: $id }, synchronous: true) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

const DELETE_COLLECTION = `#graphql
  mutation DeleteCollection($id: ID!) {
    collectionDelete(input: { id: $id }) {
      deletedCollectionId
      userErrors {
        field
        message
      }
    }
  }
`;

const DELETE_METAFIELD_DEFINITION = `#graphql
  mutation DeleteMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
    metafieldDefinitionDelete(identifier: $identifier, deleteAllAssociatedMetafields: true) {
      deletedDefinitionId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const checksumKey = { namespace: CHECKSUM_METAFIELD.namespace, key: CHECKSUM_METAFIELD.key };

interface ProductCandidate {
  id: string;
  handle: string;
  tags: readonly string[];
  seedChecksum?: { value: string } | null;
}

/** Only resources with both the seed tag and the checksum metafield count as ours. */
export function isSeeded(product: Pick<ProductCandidate, "tags" | "seedChecksum">): boolean {
  return product.tags.includes(SEED_TAG) && Boolean(product.seedChecksum);
}

/**
 * Removes everything the seeder created: products (with their media), collections, metafield
 * definitions and webhook subscriptions. Anything not marked as ours is left alone.
 */
export async function teardown(ctx: RunContext): Promise<Outcome[]> {
  return [
    ...(await deleteProducts(ctx)),
    ...(await deleteCollections(ctx)),
    ...(await deleteMetafieldDefinitions(ctx)),
    // Last, so the storefront is still subscribed while the products and collections go.
    ...(await deleteWebhooks(ctx)),
  ];
}

async function deleteWebhooks({ client, logger, dryRun }: RunContext): Promise<Outcome[]> {
  const { webhookSubscriptions } = await client.request(WEBHOOK_SUBSCRIPTIONS);
  const outcomes: Outcome[] = [];

  for (const { id, topic, uri } of webhookSubscriptions.nodes.filter(isRevalidation)) {
    if (!dryRun) {
      const { webhookSubscriptionDelete } = await client.request(DELETE_WEBHOOK, { id });
      assertNoUserErrors(`unsubscribe ${topic}`, webhookSubscriptionDelete?.userErrors);
    }
    const action = dryRun ? "would-delete" : "deleted";
    logger.info(`webhook.${action}`, { topic, uri });
    outcomes.push({ resource: "webhook", handle: topic, action });
  }
  return outcomes;
}

async function deleteProducts(ctx: RunContext): Promise<Outcome[]> {
  const { client, logger, dryRun } = ctx;
  const outcomes: Outcome[] = [];

  for (const product of await findSeededProducts(ctx)) {
    if (!dryRun) {
      const { productDelete } = await client.request(DELETE_PRODUCT, { id: product.id });
      assertNoUserErrors(`delete product ${product.handle}`, productDelete?.userErrors);
    }
    const action = dryRun ? "would-delete" : "deleted";
    logger.info(`product.${action}`, { handle: product.handle, id: product.id });
    outcomes.push({ resource: "product", handle: product.handle, action });
  }
  return outcomes;
}

async function findSeededProducts({ client, logger }: RunContext): Promise<ProductCandidate[]> {
  const found = new Map<string, ProductCandidate>();
  const consider = (product: ProductCandidate) => {
    if (isSeeded(product)) found.set(product.id, product);
    else if (product.tags.includes(SEED_TAG)) {
      logger.warn("product.not-owned", { handle: product.handle, reason: "no checksum metafield" });
    }
  };

  // The tag search also finds products that were removed from the catalog after seeding.
  let after: string | null = null;
  do {
    const { products }: SeededProductsQuery = await client.request(SEEDED_PRODUCTS, {
      query: `tag:"${SEED_TAG}"`,
      after,
      ...checksumKey,
    });
    products.nodes.forEach(consider);
    after = products.pageInfo.hasNextPage ? (products.pageInfo.endCursor ?? null) : null;
  } while (after);

  // Search results can lag behind recent writes, so look up catalog handles directly too.
  for (const { handle } of catalogProducts) {
    const { productByIdentifier } = await client.request(PRODUCT_BY_HANDLE, {
      handle,
      ...checksumKey,
    });
    if (productByIdentifier) consider({ ...productByIdentifier, handle });
  }

  return [...found.values()];
}

async function deleteCollections({ client, logger, dryRun }: RunContext): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];

  for (const { handle } of collections) {
    const { collectionByIdentifier: collection } = await client.request(COLLECTION_BY_HANDLE, {
      handle,
      ...checksumKey,
    });
    if (!collection) continue;
    if (!collection.seedChecksum) {
      logger.warn("collection.not-owned", { handle, reason: "no checksum metafield" });
      continue;
    }

    if (!dryRun) {
      const { collectionDelete } = await client.request(DELETE_COLLECTION, { id: collection.id });
      assertNoUserErrors(`delete collection ${handle}`, collectionDelete?.userErrors);
    }
    const action = dryRun ? "would-delete" : "deleted";
    logger.info(`collection.${action}`, { handle, id: collection.id });
    outcomes.push({ resource: "collection", handle, action });
  }
  return outcomes;
}

async function deleteMetafieldDefinitions({
  client,
  logger,
  dryRun,
}: RunContext): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  const definitions = Object.values(PRODUCT_METAFIELDS);

  for (const namespace of new Set(definitions.map((d) => d.namespace))) {
    const { metafieldDefinitions } = await client.request(PRODUCT_METAFIELD_DEFINITIONS, {
      namespace,
    });
    const existing = new Set(metafieldDefinitions.nodes.map((d) => d.key));

    for (const { key } of definitions.filter(
      (d) => d.namespace === namespace && existing.has(d.key),
    )) {
      const handle = `${namespace}.${key}`;
      if (!dryRun) {
        const { metafieldDefinitionDelete } = await client.request(DELETE_METAFIELD_DEFINITION, {
          identifier: { ownerType: "PRODUCT", namespace, key },
        });
        assertNoUserErrors(
          `delete metafield definition ${handle}`,
          metafieldDefinitionDelete?.userErrors,
        );
      }
      const action = dryRun ? "would-delete" : "deleted";
      logger.info(`metafield-definition.${action}`, { handle });
      outcomes.push({ resource: "metafield-definition", handle, action });
    }
  }
  return outcomes;
}
