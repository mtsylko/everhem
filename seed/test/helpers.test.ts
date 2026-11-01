import { describe, expect, it } from "vitest";
import { summarize } from "../src/outcome.ts";
import { missingScopes, pickLocation } from "../src/steps/preflight.ts";
import { missingPublications } from "../src/steps/publish.ts";
import { buildUploadForm } from "../src/steps/uploads.ts";
import { isRevalidation, planWebhooks } from "../src/steps/webhooks.ts";
import { isSeeded } from "../src/teardown.ts";
import { mapPool } from "../src/util/pool.ts";

describe("missingScopes", () => {
  it("treats a write scope as covering the read scope", () => {
    expect(
      missingScopes(["write_products", "write_locations"], ["write_products", "read_locations"]),
    ).toEqual([]);
  });

  it("lists scopes that are not granted", () => {
    expect(missingScopes(["read_products"], ["write_products", "write_files"])).toEqual([
      "write_products",
      "write_files",
    ]);
  });
});

describe("pickLocation", () => {
  it("prefers an active location that ships online orders", () => {
    const picked = pickLocation([
      { id: "1", isActive: false, fulfillsOnlineOrders: true },
      { id: "2", isActive: true, fulfillsOnlineOrders: false },
      { id: "3", isActive: true, fulfillsOnlineOrders: true },
    ]);
    expect(picked?.id).toBe("3");
  });

  it("falls back to any active location", () => {
    expect(pickLocation([{ id: "2", isActive: true, fulfillsOnlineOrders: false }])?.id).toBe("2");
    expect(
      pickLocation([{ id: "1", isActive: false, fulfillsOnlineOrders: true }]),
    ).toBeUndefined();
  });
});

describe("missingPublications", () => {
  it("returns channels the resource is not published to", () => {
    const all = [
      { id: "p1", title: "Online Store" },
      { id: "p2", title: "Headless" },
    ];
    expect(missingPublications(all, ["p1"])).toEqual([{ id: "p2", title: "Headless" }]);
  });
});

describe("isSeeded", () => {
  it("needs both the seed tag and the checksum metafield", () => {
    expect(isSeeded({ tags: ["plainweft-seed"], seedChecksum: { value: "sha256:x" } })).toBe(true);
    expect(isSeeded({ tags: ["plainweft-seed"], seedChecksum: null })).toBe(false);
    expect(isSeeded({ tags: [], seedChecksum: { value: "sha256:x" } })).toBe(false);
  });
});

describe("summarize", () => {
  it("counts actions per resource", () => {
    expect(
      summarize([
        { resource: "product", handle: "a", action: "created" },
        { resource: "product", handle: "b", action: "skipped" },
        { resource: "product", handle: "c", action: "created" },
        { resource: "collection", handle: "tees", action: "skipped" },
      ]),
    ).toEqual({ product: { created: 2, skipped: 1 }, collection: { skipped: 1 } });
  });
});

describe("buildUploadForm", () => {
  it("puts the signed parameters before the file", () => {
    const form = buildUploadForm(
      [
        { name: "key", value: "tmp/1/a.png" },
        { name: "policy", value: "abc" },
      ],
      { filename: "a.png", mimeType: "image/png", data: new Uint8Array([1, 2, 3]) },
    );
    expect([...form.keys()]).toEqual(["key", "policy", "file"]);
    expect((form.get("file") as File).name).toBe("a.png");
  });
});

describe("mapPool", () => {
  it("keeps the order and never runs more tasks than the limit", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapPool([30, 10, 20, 5, 15], 2, async (ms, index) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, ms));
      running--;
      return index;
    });

    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(peak).toBe(2);
  });

  it("stops starting new tasks after a failure", async () => {
    const started: number[] = [];
    await expect(
      mapPool([1, 2, 3, 4], 1, async (n) => {
        started.push(n);
        if (n === 2) throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(started).toEqual([1, 2]);
  });
});

describe("isRevalidation", () => {
  it("knows the storefront's route at any address", () => {
    expect(isRevalidation({ uri: "https://plainweft.vercel.app/api/revalidate" })).toBe(true);
    expect(isRevalidation({ uri: "https://preview.example.com/api/revalidate" })).toBe(true);
  });

  it("leaves other endpoints alone", () => {
    expect(isRevalidation({ uri: "https://plainweft.vercel.app/api/orders" })).toBe(false);
    expect(isRevalidation({ uri: "not a url" })).toBe(false);
  });
});

describe("planWebhooks", () => {
  const uri = "https://plainweft.vercel.app/api/revalidate";
  const changeFor = (plan: ReturnType<typeof planWebhooks>, topic: string) =>
    plan.find((planned) => planned.topic === topic);

  it("subscribes every topic on a new store", () => {
    const plan = planWebhooks([], uri);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((planned) => planned.change === "create")).toBe(true);
  });

  it("keeps a subscription that already calls the route", () => {
    const plan = planWebhooks([{ id: "1", topic: "PRODUCTS_UPDATE", uri }], uri);
    expect(changeFor(plan, "PRODUCTS_UPDATE")).toEqual({
      topic: "PRODUCTS_UPDATE",
      change: "keep",
      id: "1",
    });
  });

  it("moves a subscription from an earlier address instead of adding one", () => {
    const old = {
      id: "2",
      topic: "PRODUCTS_UPDATE",
      uri: "https://old.example.com/api/revalidate",
    };
    expect(changeFor(planWebhooks([old], uri), "PRODUCTS_UPDATE")).toEqual({
      topic: "PRODUCTS_UPDATE",
      change: "update",
      id: "2",
    });
    expect(
      changeFor(planWebhooks([old, { ...old, id: "3", uri }], uri), "PRODUCTS_UPDATE"),
    ).toEqual({ topic: "PRODUCTS_UPDATE", change: "keep", id: "3" });
  });

  it("ignores the app's other subscriptions", () => {
    const other = { id: "4", topic: "PRODUCTS_UPDATE", uri: "https://example.com/hooks" };
    expect(changeFor(planWebhooks([other], uri), "PRODUCTS_UPDATE")?.change).toBe("create");
  });
});
