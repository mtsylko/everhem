import { describe, expect, it } from "vitest";
import { colors } from "../catalog/colors.ts";
import { quantityFor } from "../src/catalog/inventory.ts";
import type { CatalogProduct } from "../src/catalog/types.ts";
import { planVariants, skuFor } from "../src/catalog/variants.ts";

const product = {
  handle: "test-tee",
  code: "TST",
  colors: ["Black", "White"],
  stock: { kind: "in-stock", soldOut: [{ color: "White", size: "M" }] },
} as unknown as CatalogProduct;

describe("planVariants", () => {
  it("creates every color and size combination", () => {
    const variants = planVariants(product, colors);
    expect(variants).toHaveLength(10);
    expect(variants.map((v) => v.sku).slice(0, 5)).toEqual([
      "HEM-TST-BLK-XS",
      "HEM-TST-BLK-S",
      "HEM-TST-BLK-M",
      "HEM-TST-BLK-L",
      "HEM-TST-BLK-XL",
    ]);
  });

  it("marks sold-out variants with zero stock", () => {
    const whiteM = planVariants(product, colors).find((v) => v.color === "White" && v.size === "M");
    expect(whiteM?.quantity).toBe(0);
  });

  it("gives a one-size accessory one variant per color, with OS in the SKU", () => {
    const beanie = { ...product, sizes: ["One size"] } as CatalogProduct;
    const variants = planVariants(beanie, colors);
    expect(variants.map((v) => v.sku)).toEqual(["HEM-TST-BLK-OS", "HEM-TST-WHT-OS"]);
    expect(variants[0]?.quantity).toBeGreaterThan(0);
  });

  it("fails on a color missing from the palette", () => {
    expect(() => planVariants({ ...product, colors: ["Neon Pink"] }, colors)).toThrow(
      'test-tee: unknown color "Neon Pink"',
    );
  });
});

describe("skuFor", () => {
  it("joins brand, product, color and size codes", () => {
    expect(skuFor("ECT", "HGR", "XL")).toBe("HEM-ECT-HGR-XL");
  });
});

describe("quantityFor", () => {
  it("follows the size curve and gives the lead color more stock", () => {
    const stock = { kind: "in-stock" } as const;
    expect(quantityFor(stock, "Black", 0, "M")).toBe(18);
    expect(quantityFor(stock, "White", 1, "M")).toBe(14);
    expect(quantityFor(stock, "White", 1, "XS")).toBe(4);
  });

  it("returns zero for a sold-out product", () => {
    expect(quantityFor({ kind: "sold-out" }, "Black", 0, "M")).toBe(0);
  });
});
