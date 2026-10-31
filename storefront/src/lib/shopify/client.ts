import "server-only";
import {
  createStorefrontApiClient,
  type ClientResponse,
  type StorefrontOperations,
} from "@shopify/storefront-api-client";
import { API_VERSION } from "./api-version";

type Operation = keyof StorefrontOperations & string;
type Variables<Op extends Operation> = StorefrontOperations[Op]["variables"];
type Data<Op extends Operation> = StorefrontOperations[Op]["return"];

export class StorefrontApiError extends Error {}

export interface RequestOptions {
  /** Forwarded on request-time calls so Shopify rate-limits per shopper, not per server. */
  buyerIp?: string | null;
}

let client: ReturnType<typeof createStorefrontApiClient> | undefined;

function getClient() {
  client ??= createStorefrontApiClient({
    storeDomain: requiredEnv("SHOPIFY_STORE_DOMAIN"),
    apiVersion: API_VERSION,
    // A private token, because every request comes from the server.
    privateAccessToken: requiredEnv("SHOPIFY_STOREFRONT_PRIVATE_TOKEN"),
    retries: 2,
  });
  return client;
}

/** Types come from codegen: the operation string itself is the lookup key. */
export async function storefront<Op extends Operation>(
  operation: Op,
  variables?: Variables<Op>,
  { buyerIp }: RequestOptions = {},
): Promise<Data<Op>> {
  const response: ClientResponse = await getClient().request(operation as string, {
    variables: (variables ?? {}) as Record<string, unknown>,
    headers: buyerIp ? { "Shopify-Storefront-Buyer-IP": buyerIp } : undefined,
  });

  const name = operationName(operation);
  if (response.errors) throw new StorefrontApiError(`${name}: ${describeErrors(response.errors)}`);
  if (!response.data) throw new StorefrontApiError(`${name}: response has no data`);
  return response.data as Data<Op>;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy storefront/.env.example to .env.local.`);
  return value;
}

function operationName(operation: string): string {
  return /\b(?:query|mutation)\s+(\w+)/.exec(operation)?.[1] ?? "anonymous";
}

function describeErrors(errors: NonNullable<ClientResponse["errors"]>): string {
  const messages = errors.graphQLErrors?.map((error) => error.message) ?? [];
  if (messages.length > 0) return messages.join("; ");
  const status = errors.networkStatusCode ? ` (HTTP ${errors.networkStatusCode})` : "";
  return `${errors.message ?? "Unknown error"}${status}`;
}
