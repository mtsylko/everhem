import { describe, expect, it } from "vitest";
import { checksum, stableStringify } from "../src/catalog/checksum.ts";

describe("stableStringify", () => {
  it("sorts object keys at every level", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } })).toBe(
      '{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}',
    );
  });
});

describe("checksum", () => {
  it("ignores key order", () => {
    expect(checksum({ price: "79.00", title: "Tee" })).toBe(
      checksum({ title: "Tee", price: "79.00" }),
    );
  });

  it("changes when a value or the array order changes", () => {
    const original = checksum({ colors: ["Black", "White"], price: "79.00" });
    expect(checksum({ colors: ["Black", "White"], price: "89.00" })).not.toBe(original);
    expect(checksum({ colors: ["White", "Black"], price: "79.00" })).not.toBe(original);
  });

  it("has a readable algorithm prefix", () => {
    expect(checksum({})).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});
