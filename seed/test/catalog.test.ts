import { describe, expect, it } from "vitest";
import { collections } from "../catalog/collections.ts";
import { colors } from "../catalog/colors.ts";
import { products } from "../catalog/products.ts";
import { validateCatalog } from "../src/catalog/validate.ts";
import { planVariants } from "../src/catalog/variants.ts";
import type { CatalogProduct } from "../src/catalog/types.ts";

describe("Everhem catalog", () => {
  it("is valid", () => {
    expect(validateCatalog(products, collections, colors)).toEqual([]);
  });

  it("has 36 products across 4 collections, each in 2 or 3 colors", () => {
    expect(products).toHaveLength(36);
    expect(new Set(products.map((p) => p.collection))).toEqual(
      new Set(["tees", "hoodies", "knitwear", "accessories"]),
    );
    for (const product of products) {
      expect(product.colors.length).toBeGreaterThanOrEqual(2);
      expect(product.colors.length).toBeLessThanOrEqual(3);
    }
  });

  it("sells accessories in one size and everything else in XS to XL", () => {
    for (const product of products) {
      const sizes = planVariants(product, colors).map((variant) => variant.size);
      expect(new Set(sizes)).toEqual(
        new Set(product.collection === "accessories" ? ["One size"] : ["XS", "S", "M", "L", "XL"]),
      );
    }
  });

  it("has a few fully sold-out products", () => {
    const soldOut = products.filter((p) =>
      planVariants(p, colors).every((variant) => variant.quantity === 0),
    );
    expect(soldOut.length).toBeGreaterThanOrEqual(2);
    expect(soldOut.length).toBeLessThan(products.length / 2);
  });
});

describe("validateCatalog", () => {
  const base = products[0] as CatalogProduct;

  it("reports duplicate handles and SKU codes", () => {
    const errors = validateCatalog([base, { ...base }], collections, colors);
    expect(errors).toContain(`duplicate product handle "${base.handle}"`);
    expect(errors).toContain(`duplicate product code "${base.code}"`);
    expect(errors.some((e) => e.startsWith("duplicate SKU"))).toBe(true);
  });

  it("reports a sold-out size the product doesn't come in", () => {
    const beanie = products.find((p) => p.sizes) as CatalogProduct;
    const broken = {
      ...beanie,
      stock: {
        kind: "in-stock" as const,
        soldOut: [{ color: beanie.colors[0] as string, size: "M" as const }],
      },
    };
    expect(validateCatalog([broken], collections, colors)).toContain(
      `${beanie.handle}: sold-out size "M" is not a product size`,
    );
  });

  it("reports unknown colors and collections", () => {
    const broken = { ...base, colors: ["Black", "Neon Pink"], collection: "shoes" };
    expect(validateCatalog([broken], collections, colors)).toEqual(
      expect.arrayContaining([
        `${base.handle}: unknown collection "shoes"`,
        `${base.handle}: unknown color "Neon Pink"`,
      ]),
    );
  });

  it("keeps products from naming a collection that picks its own", () => {
    const errors = validateCatalog([{ ...base, collection: "all" }], collections, colors);
    expect(errors).toContain(`${base.handle}: collection "all" picks its products by conditions`);
  });

  it("checks prices", () => {
    const errors = validateCatalog(
      [{ ...base, price: "79", compareAtPrice: "59.00" }],
      collections,
      colors,
    );
    expect(errors).toContain(`${base.handle}: price "79" must look like 79.00`);
  });

  it("requires a compare-at price above the price", () => {
    const errors = validateCatalog([{ ...base, compareAtPrice: "59.00" }], collections, colors);
    expect(errors).toContain(`${base.handle}: compare-at price must be higher than the price`);
  });
});
