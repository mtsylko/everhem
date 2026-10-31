import { describe, expect, it } from "vitest";
import { summarize } from "../src/outcome.ts";
import { missingScopes, pickLocation } from "../src/steps/preflight.ts";
import { missingPublications } from "../src/steps/publish.ts";
import { buildUploadForm } from "../src/steps/uploads.ts";
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
    expect(isSeeded({ tags: ["everhem-seed"], seedChecksum: { value: "sha256:x" } })).toBe(true);
    expect(isSeeded({ tags: ["everhem-seed"], seedChecksum: null })).toBe(false);
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
