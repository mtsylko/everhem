import { describe, expect, it } from "vitest";
import { collections } from "../catalog/collections.ts";
import { colors } from "../catalog/colors.ts";
import { products } from "../catalog/products.ts";
import { planImages, translatedAlt } from "../src/catalog/images.ts";
import {
  planTranslations,
  wantedCollectionTranslations,
  wantedProductTranslations,
  type ProductSources,
  type TranslatableResource,
} from "../src/catalog/translations.ts";
import type { CatalogCollection, CatalogProduct } from "../src/catalog/types.ts";

const product = products.find((p) => p.handle === "essential-crew-tee") as CatalogProduct;
const [front] = planImages(product, "");

const sources: ProductSources = {
  id: "gid://shopify/Product/1",
  options: [
    {
      name: "Color",
      optionValues: [
        { id: "gid://shopify/ProductOptionValue/1", name: "Black" },
        { id: "gid://shopify/ProductOptionValue/2", name: "Neon Pink" },
      ],
    },
    {
      name: "Size",
      optionValues: [
        { id: "gid://shopify/ProductOptionValue/3", name: "M" },
        { id: "gid://shopify/ProductOptionValue/4", name: "One size" },
      ],
    },
  ],
  fabric: { id: "gid://shopify/Metafield/1" },
  care: null,
  media: {
    nodes: [
      { id: "gid://shopify/MediaImage/1", alt: front?.alt },
      { id: "gid://shopify/MediaImage/2", alt: "Edited in the admin" },
    ],
  },
};

describe("Plainweft catalog translations", () => {
  it("translates every product, collection and color into Polish", () => {
    for (const p of products) expect(p.translations.pl.title).not.toBe(p.title);
    for (const c of collections) expect(c.translations.pl.title).not.toBe(c.title);
    for (const p of products) expect(p.translations.pl.care).toHaveLength(p.care.length);
    for (const color of colors.values()) expect(color.translations.pl).toBeTruthy();
  });
});

describe("translatedAlt", () => {
  it("names the product, colour and view in Polish", () => {
    expect(translatedAlt(product, front!, colors, "pl")).toBe(
      "T-shirt Essential, kolor biały, widok z przodu",
    );
    // A two-colour product ends on a back view.
    const boxy = products.find((p) => p.handle === "heavyweight-boxy-tee") as CatalogProduct;
    const back = planImages(boxy, "")[2]!;
    expect(translatedAlt(boxy, back, colors, "pl")).toBe(
      "Gruby T-shirt Boxy, kolor ecru, widok z tyłu",
    );
  });
});

describe("wantedProductTranslations", () => {
  const wanted = wantedProductTranslations(product, sources, colors, "pl");

  it("translates the product text, colours, fabric and alt text, but not XS to XL", () => {
    expect(wanted.get(sources.id)).toEqual({
      title: "T-shirt Essential",
      body_html: product.translations.pl.descriptionHtml,
    });
    expect(wanted.get("gid://shopify/ProductOptionValue/1")).toEqual({ name: "Czarny" });
    expect(wanted.has("gid://shopify/ProductOptionValue/3")).toBe(false);
    expect(wanted.get("gid://shopify/ProductOptionValue/4")).toEqual({
      name: "Rozmiar uniwersalny",
    });
    expect(wanted.get("gid://shopify/Metafield/1")).toEqual({
      value: "100% bawełna organiczna, dzianina 180 g/m²",
    });
    expect(wanted.get("gid://shopify/MediaImage/1")).toEqual({
      alt: "T-shirt Essential, kolor biały, widok z przodu",
    });
  });

  it("skips what it doesn't know: unknown colours and images with other alt text", () => {
    expect(wanted.has("gid://shopify/ProductOptionValue/2")).toBe(false);
    expect(wanted.has("gid://shopify/MediaImage/2")).toBe(false);
  });

  it("writes care steps as a JSON list, like the metafield", () => {
    const withCare = wantedProductTranslations(
      product,
      { ...sources, care: { id: "gid://shopify/Metafield/2" } },
      colors,
      "pl",
    );
    expect(JSON.parse(withCare.get("gid://shopify/Metafield/2")?.value ?? "")).toEqual(
      product.translations.pl.care,
    );
  });
});

describe("wantedCollectionTranslations", () => {
  it("translates the title and description", () => {
    const collection = collections[0] as CatalogCollection;
    expect(wantedCollectionTranslations(collection, "gid://shopify/Collection/1", "pl")).toEqual(
      new Map([
        [
          "gid://shopify/Collection/1",
          { title: "T-shirty", body_html: collection.translations.pl.descriptionHtml },
        ],
      ]),
    );
  });
});

describe("planTranslations", () => {
  const wanted = new Map([
    ["gid://shopify/Product/1", { title: "Nowy", body_html: "<p>Opis</p>" }],
  ]);
  const resource = (translations: TranslatableResource["translations"]): TranslatableResource => ({
    resourceId: "gid://shopify/Product/1",
    translatableContent: [
      { key: "title", digest: "d-title" },
      { key: "body_html", digest: "d-body" },
    ],
    translations,
  });

  it("registers missing translations with the digest of the English text", () => {
    const plan = planTranslations(wanted, [resource([])], "pl");
    expect(plan.existed).toBe(false);
    expect(plan.register.get("gid://shopify/Product/1")).toEqual([
      { locale: "pl", key: "title", value: "Nowy", translatableContentDigest: "d-title" },
      { locale: "pl", key: "body_html", value: "<p>Opis</p>", translatableContentDigest: "d-body" },
    ]);
  });

  it("leaves up-to-date translations alone", () => {
    const plan = planTranslations(
      wanted,
      [
        resource([
          { key: "title", value: "Nowy", outdated: false },
          { key: "body_html", value: "<p>Opis</p>", outdated: false },
        ]),
      ],
      "pl",
    );
    expect(plan.register.size).toBe(0);
    expect(plan.existed).toBe(true);
  });

  it("registers changed and outdated translations again", () => {
    const plan = planTranslations(
      wanted,
      [
        resource([
          { key: "title", value: "Stary", outdated: false },
          { key: "body_html", value: "<p>Opis</p>", outdated: true },
        ]),
      ],
      "pl",
    );
    expect(plan.register.get("gid://shopify/Product/1")?.map((input) => input.key)).toEqual([
      "title",
      "body_html",
    ]);
  });

  it("reports keys the store doesn't offer for translation", () => {
    const plan = planTranslations(
      new Map([["gid://shopify/Metafield/2", { value: "[]" }]]),
      [{ resourceId: "gid://shopify/Metafield/2", translatableContent: [], translations: [] }],
      "pl",
    );
    expect(plan.unsupported).toEqual(["gid://shopify/Metafield/2 value"]);
    expect(plan.register.size).toBe(0);
  });
});
