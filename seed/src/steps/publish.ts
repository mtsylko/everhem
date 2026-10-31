import type { RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";
import type { Publication, Store } from "./preflight.ts";

const PUBLISH = `#graphql
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

export function missingPublications(
  all: readonly Publication[],
  publishedIds: readonly string[],
): Publication[] {
  const published = new Set(publishedIds);
  return all.filter((publication) => !published.has(publication.id));
}

/** Publishes to every sales channel the resource is not on yet, e.g. Online Store and Headless. */
export async function publishEverywhere(
  { client, logger, dryRun }: RunContext,
  store: Store,
  resource: { id: string; kind: "product" | "collection"; handle: string },
  publishedIds: readonly string[],
): Promise<void> {
  const missing = missingPublications(store.publications, publishedIds);
  if (missing.length === 0) return;

  const titles = missing.map((publication) => publication.title);
  if (dryRun) {
    logger.info(`${resource.kind}.would-publish`, {
      handle: resource.handle,
      publications: titles,
    });
    return;
  }

  const { publishablePublish } = await client.request(PUBLISH, {
    id: resource.id,
    input: missing.map((publication) => ({ publicationId: publication.id })),
  });
  assertNoUserErrors(`publish ${resource.kind} ${resource.handle}`, publishablePublish?.userErrors);
  logger.info(`${resource.kind}.published`, { handle: resource.handle, publications: titles });
}
