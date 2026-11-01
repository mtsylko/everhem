export type AuthConfig =
  | { kind: "token"; accessToken: string }
  | { kind: "client-credentials"; clientId: string; clientSecret: string };

export interface Config {
  storeDomain: string;
  auth: AuthConfig;
  /** Where the storefront is deployed, as an origin. Without it the seed subscribes no webhooks. */
  storefrontUrl: string | undefined;
}

export class ConfigError extends Error {}

type Env = Readonly<Record<string, string | undefined>>;

export function loadConfig(env: Env = process.env): Config {
  const domain = read(env, "SHOPIFY_STORE_DOMAIN");
  if (!domain) {
    throw new ConfigError(
      "Missing SHOPIFY_STORE_DOMAIN. Copy seed/.env.example to seed/.env and fill it in.",
    );
  }
  return {
    storeDomain: normalizeStoreDomain(domain),
    auth: readAuth(env),
    storefrontUrl: readStorefrontUrl(env),
  };
}

export function normalizeStoreDomain(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const domain = host.includes(".") ? host : `${host}.myshopify.com`;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new ConfigError(
      `SHOPIFY_STORE_DOMAIN must look like your-store.myshopify.com, got "${value}".`,
    );
  }
  return domain;
}

function readAuth(env: Env): AuthConfig {
  const accessToken = read(env, "SHOPIFY_ADMIN_TOKEN");
  if (accessToken) return { kind: "token", accessToken };

  const clientId = read(env, "SHOPIFY_CLIENT_ID");
  const clientSecret = read(env, "SHOPIFY_CLIENT_SECRET");
  if (clientId && clientSecret) return { kind: "client-credentials", clientId, clientSecret };

  throw new ConfigError("Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET, or SHOPIFY_ADMIN_TOKEN.");
}

function readStorefrontUrl(env: Env): string | undefined {
  const value = read(env, "STOREFRONT_URL");
  if (!value) return undefined;
  // Shopify delivers webhooks over HTTPS only, so a localhost address could never receive them.
  const url = URL.parse(value);
  if (url?.protocol !== "https:") {
    throw new ConfigError(`STOREFRONT_URL must be an https:// address, got "${value}".`);
  }
  return url.origin;
}

function read(env: Env, name: string): string | undefined {
  return env[name]?.trim() || undefined;
}
