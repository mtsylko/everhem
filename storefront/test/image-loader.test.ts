import { describe, expect, it } from "vitest";
import shopifyImageLoader, { cropSquare } from "../src/lib/shopify/image-loader";

const url = "https://cdn.shopify.com/s/files/1/socks-white-front.png?v=1";
const photo = { url, width: 1000, height: 1250 };

describe("cropSquare", () => {
  it("asks the CDN for the square around the point, in the image's pixels", () => {
    const params = new URL(cropSquare(photo, 0.6, 0.5, 0.1)).searchParams;
    expect(Object.fromEntries(params)).toEqual({
      v: "1",
      crop: "region",
      crop_left: "550",
      crop_top: "575",
      crop_width: "100",
      crop_height: "100",
    });
  });

  it("keeps the crop when the loader adds a width, so the square is what gets resized", () => {
    const src = shopifyImageLoader({ src: cropSquare(photo, 0.6, 0.5, 0.1), width: 96 });
    const params = new URL(src).searchParams;
    expect(params.get("crop")).toBe("region");
    expect(params.get("width")).toBe("96");
  });

  it("returns the whole image when it can't place the square", () => {
    expect(cropSquare({ url, width: null, height: null }, 0.6, 0.5, 0.1)).toBe(url);
    expect(cropSquare({ ...photo, url: "/socks.png" }, 0.6, 0.5, 0.1)).toBe("/socks.png");
  });
});
