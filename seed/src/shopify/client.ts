import {
  createAdminApiClient,
  type AdminOperations,
  type ClientResponse,
} from "@shopify/admin-api-client";
import type { Logger } from "../logger.ts";
import { API_VERSION } from "./api-version.ts";
import { ShopifyApiError } from "./errors.ts";
import { CostLimiter, parseThrottleStatus } from "./throttle.ts";

type Operation = keyof AdminOperations & string;
type Variables<Op extends Operation> = AdminOperations[Op]["variables"];
type Data<Op extends Operation> = AdminOperations[Op]["return"];

export interface ShopifyClient {
  /** Types come from codegen: the operation string itself is the lookup key. */
  request<Op extends Operation>(operation: Op, variables?: Variables<Op>): Promise<Data<Op>>;
}

export interface ShopifyClientOptions {
  storeDomain: string;
  accessToken: string;
  logger: Logger;
  limiter?: CostLimiter;
}

// Used until Shopify reports the real cost of an operation.
const DEFAULT_COST = 50;
const MAX_ATTEMPTS = 6;

export function createShopifyClient({
  storeDomain,
  accessToken,
  logger,
  limiter = new CostLimiter(),
}: ShopifyClientOptions): ShopifyClient {
  const client = createAdminApiClient({
    storeDomain,
    accessToken,
    apiVersion: API_VERSION,
    // Covers network-level 429 and 503. Cost throttling is handled below.
    retries: 2,
    userAgentPrefix: "everhem-seed",
  });
  const knownCosts = new Map<string, number>();

  return {
    async request(operation, variables) {
      const name = operationName(operation);

      for (let attempt = 1; ; attempt++) {
        const cost = knownCosts.get(operation) ?? DEFAULT_COST;
        const waitedMs = await limiter.acquire(cost);
        if (waitedMs > 0) logger.debug("throttle.wait", { operation: name, cost, waitedMs });

        let response: ClientResponse;
        try {
          // Typing happens in our signature above, so the inner call can stay untyped.
          response = await client.request(operation as string, {
            variables: (variables ?? {}) as Record<string, unknown>,
          });
        } catch (error) {
          limiter.settle(cost);
          throw error;
        }

        const costInfo = response.extensions?.cost;
        limiter.settle(cost, parseThrottleStatus(costInfo?.throttleStatus));
        if (typeof costInfo?.requestedQueryCost === "number") {
          knownCosts.set(operation, costInfo.requestedQueryCost);
        }

        if (isThrottled(response.errors)) {
          if (attempt >= MAX_ATTEMPTS) {
            throw new ShopifyApiError(`${name}: still throttled after ${attempt} attempts`);
          }
          logger.warn("throttle.retry", {
            operation: name,
            attempt,
            requestedCost: costInfo?.requestedQueryCost,
            available: costInfo?.throttleStatus?.currentlyAvailable,
          });
          continue;
        }

        if (response.errors)
          throw new ShopifyApiError(`${name}: ${describeErrors(response.errors)}`);
        if (!response.data) throw new ShopifyApiError(`${name}: response has no data`);
        return response.data;
      }
    },
  };
}

export function operationName(operation: string): string {
  return /\b(?:query|mutation)\s+(\w+)/.exec(operation)?.[1] ?? "anonymous";
}

export function isThrottled(errors: ClientResponse["errors"]): boolean {
  return errors?.graphQLErrors?.some((error) => error.extensions?.code === "THROTTLED") ?? false;
}

function describeErrors(errors: NonNullable<ClientResponse["errors"]>): string {
  const messages = errors.graphQLErrors?.map((error) => error.message) ?? [];
  if (messages.length > 0) return messages.join("; ");
  const status = errors.networkStatusCode ? ` (HTTP ${errors.networkStatusCode})` : "";
  return `${errors.message ?? "Unknown error"}${status}`;
}
