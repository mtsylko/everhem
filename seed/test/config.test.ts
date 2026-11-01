import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig, normalizeStoreDomain } from "../src/config.ts";

describe("normalizeStoreDomain", () => {
  it.each([
    ["plainweft-demo", "plainweft-demo.myshopify.com"],
    ["plainweft-demo.myshopify.com", "plainweft-demo.myshopify.com"],
    ["https://Plainweft-Demo.myshopify.com/", "plainweft-demo.myshopify.com"],
  ])("turns %s into %s", (input, expected) => {
    expect(normalizeStoreDomain(input)).toBe(expected);
  });

  it("rejects other domains", () => {
    expect(() => normalizeStoreDomain("shop.example.com")).toThrow(ConfigError);
  });
});

describe("loadConfig", () => {
  it("prefers a static token", () => {
    const config = loadConfig({
      SHOPIFY_STORE_DOMAIN: "plainweft-demo",
      SHOPIFY_ADMIN_TOKEN: "shpat_1",
      SHOPIFY_CLIENT_ID: "id",
      SHOPIFY_CLIENT_SECRET: "secret",
    });
    expect(config.auth).toEqual({ kind: "token", accessToken: "shpat_1" });
  });

  it("uses client credentials when there is no token", () => {
    const config = loadConfig({
      SHOPIFY_STORE_DOMAIN: "plainweft-demo",
      SHOPIFY_CLIENT_ID: "id",
      SHOPIFY_CLIENT_SECRET: "secret",
    });
    expect(config).toEqual({
      storeDomain: "plainweft-demo.myshopify.com",
      auth: { kind: "client-credentials", clientId: "id", clientSecret: "secret" },
    });
  });

  it("explains what is missing", () => {
    expect(() => loadConfig({})).toThrow(/SHOPIFY_STORE_DOMAIN/);
    expect(() => loadConfig({ SHOPIFY_STORE_DOMAIN: "a", SHOPIFY_CLIENT_ID: "id" })).toThrow(
      /SHOPIFY_CLIENT_SECRET/,
    );
  });

  it("reads the storefront's address as an origin", () => {
    const env = { SHOPIFY_STORE_DOMAIN: "plainweft-demo", SHOPIFY_ADMIN_TOKEN: "shpat_1" };
    expect(loadConfig(env).storefrontUrl).toBeUndefined();
    expect(
      loadConfig({ ...env, STOREFRONT_URL: "https://plainweft.vercel.app/" }).storefrontUrl,
    ).toBe("https://plainweft.vercel.app");
  });

  it("refuses a storefront address Shopify can't call", () => {
    const env = { SHOPIFY_STORE_DOMAIN: "plainweft-demo", SHOPIFY_ADMIN_TOKEN: "shpat_1" };
    expect(() => loadConfig({ ...env, STOREFRONT_URL: "http://localhost:3000" })).toThrow(
      /STOREFRONT_URL/,
    );
    expect(() => loadConfig({ ...env, STOREFRONT_URL: "plainweft.vercel.app" })).toThrow(
      ConfigError,
    );
  });
});
