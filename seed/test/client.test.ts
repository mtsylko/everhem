import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "../src/logger.ts";
import { createShopifyClient, isThrottled, operationName } from "../src/shopify/client.ts";
import { CostLimiter } from "../src/shopify/throttle.ts";

const request = vi.fn();
vi.mock("@shopify/admin-api-client", () => ({
  createAdminApiClient: () => ({ request }),
}));

const SHOP = `#graphql
  query ShopName {
    shop {
      name
    }
  }
`;

const throttleStatus = { maximumAvailable: 1000, currentlyAvailable: 10, restoreRate: 50 };

function setup() {
  let now = 0;
  const sleeps: number[] = [];
  const limiter = new CostLimiter({
    now: () => now,
    sleep: async (ms) => {
      sleeps.push(ms);
      now += ms;
    },
  });
  const lines: string[] = [];
  const logger = createLogger({ level: "debug", write: (line) => lines.push(line) });
  const client = createShopifyClient({
    storeDomain: "x.myshopify.com",
    accessToken: "t",
    logger,
    limiter,
  });
  return { client, sleeps, lines };
}

describe("createShopifyClient", () => {
  beforeEach(() => request.mockReset());

  it("returns data and remembers the bucket state", async () => {
    const { client, sleeps } = setup();
    request.mockResolvedValue({
      data: { shop: { name: "Everhem" } },
      extensions: { cost: { requestedQueryCost: 2, throttleStatus } },
    });

    await expect(client.request(SHOP)).resolves.toEqual({ shop: { name: "Everhem" } });
    expect(sleeps).toEqual([]);
  });

  it("backs off and retries when Shopify answers THROTTLED", async () => {
    const { client, sleeps, lines } = setup();
    request
      .mockResolvedValueOnce({
        errors: { graphQLErrors: [{ message: "Throttled", extensions: { code: "THROTTLED" } }] },
        extensions: { cost: { requestedQueryCost: 110, throttleStatus } },
      })
      .mockResolvedValueOnce({ data: { shop: { name: "Everhem" } } });

    await expect(client.request(SHOP)).resolves.toEqual({ shop: { name: "Everhem" } });
    // 10 points available, 110 needed, 50 per second → 2 seconds.
    expect(sleeps).toEqual([2000]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(lines.some((line) => line.includes('"event":"throttle.retry"'))).toBe(true);
  });

  it("gives up after repeated throttling", async () => {
    const { client } = setup();
    request.mockResolvedValue({
      errors: { graphQLErrors: [{ message: "Throttled", extensions: { code: "THROTTLED" } }] },
      extensions: { cost: { requestedQueryCost: 10, throttleStatus } },
    });

    await expect(client.request(SHOP)).rejects.toThrow(
      "ShopName: still throttled after 6 attempts",
    );
  });

  it("turns GraphQL errors into exceptions", async () => {
    const { client } = setup();
    request.mockResolvedValue({
      errors: { graphQLErrors: [{ message: "Field 'nope' doesn't exist" }] },
    });

    await expect(client.request(SHOP)).rejects.toThrow("ShopName: Field 'nope' doesn't exist");
  });
});

describe("operationName", () => {
  it("reads the name of a query or mutation", () => {
    expect(operationName(SHOP)).toBe("ShopName");
    expect(operationName("mutation ProductSet($input: ProductSetInput!) {}")).toBe("ProductSet");
    expect(operationName("{ shop { name } }")).toBe("anonymous");
  });
});

describe("isThrottled", () => {
  it("detects the THROTTLED error code", () => {
    expect(
      isThrottled({ graphQLErrors: [{ message: "x", extensions: { code: "THROTTLED" } }] }),
    ).toBe(true);
    expect(isThrottled({ graphQLErrors: [{ message: "x" }] })).toBe(false);
    expect(isThrottled(undefined)).toBe(false);
  });
});
