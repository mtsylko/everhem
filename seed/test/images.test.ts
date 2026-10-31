import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultImages,
  mimeTypeFor,
  planImages,
  slugify,
  variantImageFor,
} from "../src/catalog/images.ts";
import type { CatalogProduct } from "../src/catalog/types.ts";

const product = {
  handle: "test-tee",
  title: "Test Tee",
  colors: ["Heather Grey", "Black"],
} as unknown as CatalogProduct;

describe("defaultImages", () => {
  it("uses one front per color, then back views, three in total", () => {
    const images = defaultImages(product, "/images");
    expect(images.map((i) => `${i.color}/${i.view}`)).toEqual([
      "Heather Grey/front",
      "Black/front",
      "Heather Grey/back",
    ]);
    expect(images[0]?.source).toEqual({
      kind: "file",
      path: path.join("/images", "test-tee", "heather-grey-front.png"),
    });
  });

  it("uses only fronts for three colors", () => {
    const images = defaultImages({ ...product, colors: ["Black", "White", "Navy"] }, "/images");
    expect(images.every((i) => i.view === "front")).toBe(true);
  });
});

describe("planImages", () => {
  it("adds keys, alt text and upload file names", () => {
    const [first] = planImages(product, "/images");
    expect(first).toMatchObject({
      key: "heather-grey-front",
      alt: "Test Tee in Heather Grey, front view",
      filename: "test-tee-heather-grey-front.png",
    });
  });

  it("keeps the extension of a remote image", () => {
    const [image] = planImages(
      {
        ...product,
        images: [
          {
            color: "Black",
            view: "front",
            source: { kind: "url", url: "https://cdn.example.com/a/tee.JPG?w=2" },
          },
        ],
      },
      "/images",
    );
    expect(image?.filename).toBe("test-tee-black-front.jpg");
  });
});

describe("variantImageFor", () => {
  it("picks the front shot of the color", () => {
    const images = planImages(product, "/images");
    expect(variantImageFor(images, "Heather Grey")?.key).toBe("heather-grey-front");
    expect(variantImageFor(images, "Navy")).toBeUndefined();
  });
});

describe("helpers", () => {
  it("slugifies color names", () => {
    expect(slugify("Off-White")).toBe("off-white");
    expect(slugify("  Dusty Blue ")).toBe("dusty-blue");
  });

  it("maps file extensions to MIME types", () => {
    expect(mimeTypeFor("a.png")).toBe("image/png");
    expect(mimeTypeFor("a.JPEG")).toBe("image/jpeg");
    expect(() => mimeTypeFor("a.gif")).toThrow("Unsupported image type");
  });
});
