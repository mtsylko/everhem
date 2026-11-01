import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isShopifySignature } from "../src/lib/shopify/webhook";

const SECRET = "client-secret";
const body = new TextEncoder().encode('{"id":1,"title":"Koszulka z okrągłym dekoltem"}');
const sign = (bytes: Uint8Array, secret = SECRET) =>
  createHmac("sha256", secret).update(bytes).digest("base64");

describe("isShopifySignature", () => {
  it("accepts the body Shopify signed", () => {
    expect(isShopifySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects another secret, an edited body or no signature", () => {
    expect(isShopifySignature(body, sign(body, "other-secret"), SECRET)).toBe(false);
    const edited = new TextEncoder().encode('{"id":2,"title":"Koszulka z okrągłym dekoltem"}');
    expect(isShopifySignature(edited, sign(body), SECRET)).toBe(false);
    expect(isShopifySignature(body, null, SECRET)).toBe(false);
  });

  it("rejects a malformed signature instead of throwing", () => {
    expect(isShopifySignature(body, "not base64!", SECRET)).toBe(false);
    expect(isShopifySignature(body, sign(body).slice(0, 10), SECRET)).toBe(false);
  });
});
