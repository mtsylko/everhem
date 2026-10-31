import type { Logger } from "./logger.ts";
import type { ShopifyClient } from "./shopify/client.ts";

export type Resource = "product" | "collection" | "metafield-definition" | "locale" | "translation";

export type Action =
  "created" | "updated" | "skipped" | "deleted" | "would-create" | "would-update" | "would-delete";

export interface Outcome {
  resource: Resource;
  handle: string;
  action: Action;
}

export interface RunContext {
  client: ShopifyClient;
  logger: Logger;
  /** Read from the store, but change nothing. */
  dryRun: boolean;
}

/** Counts outcomes, e.g. { product: { created: 9, skipped: 3 } }. */
export function summarize(outcomes: readonly Outcome[]): Record<string, Record<string, number>> {
  const summary: Record<string, Record<string, number>> = {};
  for (const { resource, action } of outcomes) {
    const counts = (summary[resource] ??= {});
    counts[action] = (counts[action] ?? 0) + 1;
  }
  return summary;
}

export class NotOwnedError extends Error {
  constructor(resource: Resource, handle: string) {
    super(
      `A ${resource} with handle "${handle}" already exists and was not created by this seeder. ` +
        "Rename or delete it, or change the handle in the catalog.",
    );
  }
}
