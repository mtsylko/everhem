import { describe, expect, it } from "vitest";
import { colors } from "../catalog/colors.ts";
import { products } from "../catalog/products.ts";
import { planImages } from "../src/catalog/images.ts";
import { buildProductSetInput, productChecksum } from "../src/catalog/product-input.ts";
import type { CatalogProduct } from "../src/catalog/types.ts";

const product = products.find((p) => p.handle === "linen-blend-tee") as CatalogProduct;
const images = planImages(product, "/images").map((image) => ({
  ...image,
  originalSource: `https://staged.example.com/${image.filename}`,
}));

function build(existingVariantIds = new Map<string, string>()) {
  return buildProductSetInput(product, {
    palette: colors,
    locationId: "gid://shopify/Location/1",
    collectionId: "gid://shopify/Collection/1",
    images,
    existingVariantIds,
    checksum: "sha256:abc",
  });
}

describe("buildProductSetInput", () => {
  it("maps product fields and marks the product as seeded", () => {
    const input = build();
    expect(input).toMatchObject({
      handle: "linen-blend-tee",
      title: "Linen Blend Tee",
      vendor: "Plainweft",
      status: "ACTIVE",
      collections: ["gid://shopify/Collection/1"],
    });
    expect(input.tags).toEqual(["plainweft-seed", "linen", "sale"]);
  });

  it("declares color and size options", () => {
    expect(build().productOptions).toEqual([
      { name: "Color", position: 1, values: [{ name: "Sand" }, { name: "Sage" }] },
      {
        name: "Size",
        position: 2,
        values: [{ name: "XS" }, { name: "S" }, { name: "M" }, { name: "L" }, { name: "XL" }],
      },
    ]);
  });

  it("creates tracked variants with prices, stock and an image per color", () => {
    const variants = build().variants ?? [];
    expect(variants).toHaveLength(10);

    const [first] = variants;
    expect(first).toMatchObject({
      sku: "PLW-LBT-SND-XS",
      price: "149.00",
      compareAtPrice: "179.00",
      inventoryPolicy: "DENY",
      inventoryItem: { tracked: true },
      // The linen tee is sold out.
      inventoryQuantities: [
        { locationId: "gid://shopify/Location/1", name: "available", quantity: 0 },
      ],
    });
    expect(first?.file?.originalSource).toBe(
      "https://staged.example.com/linen-blend-tee-sand-front.png",
    );
  });

  it("only uses variant images that are also product files", () => {
    const input = build();
    const productSources = new Set(input.files?.map((file) => file.originalSource));
    for (const variant of input.variants ?? []) {
      expect(productSources.has(variant.file?.originalSource)).toBe(true);
    }
  });

  it("reuses ids of existing variants", () => {
    const variants = build(new Map([["Sage/M", "gid://shopify/ProductVariant/7"]])).variants ?? [];
    expect(variants.find((v) => v.sku === "PLW-LBT-SGE-M")?.id).toBe(
      "gid://shopify/ProductVariant/7",
    );
    expect(variants.find((v) => v.sku === "PLW-LBT-SND-M")?.id).toBeUndefined();
  });

  it("stores fabric, care steps and the checksum as metafields", () => {
    expect(build().metafields).toEqual([
      {
        namespace: "plainweft",
        key: "fabric",
        type: "single_line_text_field",
        value: "55% linen, 45% cotton",
      },
      {
        namespace: "plainweft",
        key: "care",
        type: "list.single_line_text_field",
        value: JSON.stringify(product.care),
      },
      {
        namespace: "plainweft_seed",
        key: "checksum",
        type: "single_line_text_field",
        value: "sha256:abc",
      },
    ]);
  });

  it("stores the reason a featured product is featured", () => {
    const tee = products.find((p) => p.handle === "essential-crew-tee") as CatalogProduct;
    const input = buildProductSetInput(tee, {
      palette: colors,
      locationId: "l",
      collectionId: "c",
      images: [],
      existingVariantIds: new Map(),
      checksum: "sha256:abc",
    });
    expect(input.metafields).toContainEqual({
      namespace: "plainweft",
      key: "featured",
      type: "single_line_text_field",
      value: "Bestseller",
    });
  });

  it("clears the compare-at price when the product is not on sale", () => {
    const tee = products.find((p) => p.handle === "essential-crew-tee") as CatalogProduct;
    const input = buildProductSetInput(tee, {
      palette: colors,
      locationId: "l",
      collectionId: "c",
      images: [],
      existingVariantIds: new Map(),
      checksum: "x",
    });
    expect(input.variants?.[0]?.compareAtPrice).toBeNull();
    expect(input.variants?.[0]?.file).toBeUndefined();
  });
});

describe("productChecksum", () => {
  it("changes when an image or the collection changes", () => {
    const original = productChecksum(product, "c1", { "sand-front": "a" });
    expect(productChecksum(product, "c1", { "sand-front": "a" })).toBe(original);
    expect(productChecksum(product, "c1", { "sand-front": "b" })).not.toBe(original);
    expect(productChecksum(product, "c2", { "sand-front": "a" })).not.toBe(original);
  });
});
