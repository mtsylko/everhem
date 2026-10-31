import { describe, expect, it } from "vitest";
import { isFeatured, placeFeatured } from "../src/lib/product/featured";

function product(handle: string, featured?: string, availableForSale = true) {
  return { handle, availableForSale, featured: featured ? { value: featured } : null };
}

function layout(products: ReturnType<typeof product>[], every = 3) {
  return placeFeatured(products, every).map(
    ({ product, double }) => `${product.handle}${double ? "*" : ""}`,
  );
}

describe("isFeatured", () => {
  it("needs a reason and stock", () => {
    expect(isFeatured(product("a", "New"))).toBe(true);
    expect(isFeatured(product("a"))).toBe(false);
    expect(isFeatured(product("a", "New", false))).toBe(false);
  });
});

describe("placeFeatured", () => {
  it("moves featured products to the double places and keeps the rest in order", () => {
    const products = [
      product("a"),
      product("b", "New"),
      product("c"),
      product("d"),
      product("e", "Bestseller"),
      product("f"),
    ];
    expect(layout(products)).toEqual(["b*", "a", "c", "e*", "d", "f"]);
  });

  it("keeps a sold-out featured product single", () => {
    const products = [product("a"), product("b", "New", false), product("c")];
    expect(layout(products)).toEqual(["a", "b", "c"]);
  });

  it("keeps featured products single once the double places run out", () => {
    const products = [product("a", "New"), product("b"), product("c", "Bestseller")];
    expect(layout(products)).toEqual(["a*", "b", "c"]);
  });

  it("fills double places with single tiles when nothing is featured", () => {
    const products = [product("a"), product("b"), product("c"), product("d")];
    expect(layout(products)).toEqual(["a", "b", "c", "d"]);
  });
});
