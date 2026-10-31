import { describe, expect, it } from "vitest";
import { formatMoney, isOnSale, lowestPrice } from "../src/lib/money";
import shopifyImageLoader from "../src/lib/shopify/image-loader";

const pln = (amount: string) => ({ amount, currencyCode: "PLN" });

// Intl separates the number and the currency with a no-break space.
const normalise = (text: string) => text.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("drops the decimals of a whole amount", () => {
    expect(normalise(formatMoney(pln("79.00")))).toBe("79 zł");
  });

  it("keeps cents when there are some", () => {
    expect(normalise(formatMoney(pln("79.5")))).toBe("79,50 zł");
  });
});

describe("isOnSale", () => {
  it("needs a compare-at price above the price", () => {
    expect(isOnSale(pln("149.00"), pln("179.00"))).toBe(true);
    expect(isOnSale(pln("149.00"), pln("149.00"))).toBe(false);
    expect(isOnSale(pln("149.00"), null)).toBe(false);
  });
});

describe("lowestPrice", () => {
  it("picks the smallest amount", () => {
    expect(lowestPrice([pln("249.00"), pln("79.00"), pln("119.00")])).toEqual(pln("79.00"));
    expect(lowestPrice([])).toBeUndefined();
  });
});

describe("shopifyImageLoader", () => {
  it("asks Shopify's CDN for the width next/image wants", () => {
    const src = "https://cdn.shopify.com/s/files/1/0/tee.png?v=1";
    expect(shopifyImageLoader({ src, width: 640 })).toBe(
      "https://cdn.shopify.com/s/files/1/0/tee.png?v=1&width=640",
    );
  });

  it("leaves other URLs alone", () => {
    expect(shopifyImageLoader({ src: "/icon.png", width: 64 })).toBe("/icon.png");
  });
});
