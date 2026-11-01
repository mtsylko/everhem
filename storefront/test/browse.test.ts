import { describe, expect, it } from "vitest";
import {
  cleanTerms,
  defaultBrowse,
  facetsFrom,
  isChosen,
  isNarrowed,
  queryFor,
  readBrowse,
  searchFor,
  toSearchParams,
  type ShopifyFilter,
} from "../src/lib/product/browse";

function read(search: string) {
  return readBrowse(new URLSearchParams(search), "collection");
}

function readSearch(search: string) {
  return readBrowse(new URLSearchParams(search), "search");
}

describe("readBrowse", () => {
  it("reads filters and sort under Liquid's parameter names", () => {
    expect(
      read(
        "filter.v.option.Color=Black&filter.v.availability=1&filter.v.price.gte=100&sort_by=price-ascending",
      ),
    ).toEqual({
      scope: "collection",
      terms: "",
      values: [
        ["filter.v.availability", "1"],
        ["filter.v.option.Color", "Black"],
      ],
      price: { min: 100 },
      sortBy: "price-ascending",
    });
  });

  it("drops what it doesn't know, empty fields and repeats", () => {
    expect(
      read("filter.v.colour=red&utm_source=x&filter.v.price.lte=&filter.p.tag=a&filter.p.tag=a"),
    ).toEqual({
      scope: "collection",
      terms: "",
      values: [["filter.p.tag", "a"]],
      price: {},
      sortBy: "manual",
    });
    expect(read("sort_by=constructor").sortBy).toBe("manual");
    expect(read("filter.v.availability=yes").values).toEqual([]);
  });

  it("reads asking for both stock states as asking for neither", () => {
    expect(read("filter.v.availability=1&filter.v.availability=0").values).toEqual([]);
  });

  it("keeps a value whole when it has a comma in it", () => {
    expect(read("filter.p.m.plainweft.fabric=55%25+linen%2C+45%25+cotton").values).toEqual([
      ["filter.p.m.plainweft.fabric", "55% linen, 45% cotton"],
    ]);
  });

  it("orders values the same way whatever order the URL has", () => {
    expect(read("filter.p.tag=b&filter.p.tag=a")).toEqual(read("filter.p.tag=a&filter.p.tag=b"));
  });

  it("reads prices typed with a comma, and turns a backwards range around", () => {
    expect(read("filter.v.price.gte=99,5").price).toEqual({ min: 99.5 });
    expect(read("filter.v.price.gte=300&filter.v.price.lte=100").price).toEqual({
      min: 100,
      max: 300,
    });
    expect(read("filter.v.price.gte=-5&filter.v.price.lte=abc").price).toEqual({});
  });

  it("takes only the sorts its list has", () => {
    expect(read("sort_by=relevance").sortBy).toBe("manual");
    expect(readSearch("sort_by=manual").sortBy).toBe("relevance");
    expect(readSearch("sort_by=price-descending").sortBy).toBe("price-descending");
  });

  it("reads search terms for a search only", () => {
    expect(readSearch("q=+black++hoodie+").terms).toBe("black hoodie");
    expect(read("q=black").terms).toBe("");
  });
});

describe("cleanTerms", () => {
  it("trims, joins spaces and cuts long terms short", () => {
    expect(cleanTerms("  merino \n scarf ")).toBe("merino scarf");
    expect(cleanTerms("a".repeat(500))).toHaveLength(100);
  });
});

describe("queryFor", () => {
  it("turns the URL into Storefront API filters and a sort key", () => {
    expect(
      queryFor(
        read(
          "filter.v.availability=1&filter.v.option.Size=M&filter.p.m.plainweft.fabric=Linen&filter.v.price.lte=300&sort_by=created-descending",
        ),
      ),
    ).toEqual({
      filters: [
        { productMetafield: { namespace: "plainweft", key: "fabric", value: "Linen" } },
        { available: true },
        { variantOption: { name: "Size", value: "M" } },
        { price: { max: 300 } },
      ],
      sortKey: "CREATED",
      reverse: true,
    });
  });

  it("asks for the collection's own order by default", () => {
    expect(queryFor(defaultBrowse("collection"))).toEqual({
      filters: [],
      sortKey: "COLLECTION_DEFAULT",
      reverse: false,
    });
  });

  it("ranks search results by relevance by default, and can sort them by price", () => {
    expect(queryFor(defaultBrowse("search", "linen"))).toMatchObject({ sortKey: "RELEVANCE" });
    expect(queryFor(readSearch("q=linen&sort_by=price-descending"))).toMatchObject({
      sortKey: "PRICE",
      reverse: true,
    });
  });
});

describe("searchFor", () => {
  it("writes back what readBrowse reads", () => {
    const search = "?filter.v.availability=1&filter.v.price.gte=100&sort_by=price-descending";
    expect(searchFor(read(search))).toBe(search);
  });

  it("leaves the default sort and an empty state out", () => {
    expect(searchFor(defaultBrowse("collection"))).toBe("");
    expect(searchFor(read("sort_by=manual"))).toBe("");
    expect(searchFor(readSearch("sort_by=relevance"))).toBe("");
  });

  it("puts a search's terms first, so filters keep them", () => {
    expect(searchFor(readSearch("filter.v.availability=1&q=black+tee"))).toBe(
      "?q=black+tee&filter.v.availability=1",
    );
    expect(searchFor({ ...readSearch("q=tee&filter.v.price.lte=50"), price: {} })).toBe("?q=tee");
  });
});

describe("isNarrowed", () => {
  it("counts filters and prices, not the sort", () => {
    expect(isNarrowed(read("sort_by=price-ascending"))).toBe(false);
    expect(isNarrowed(read("filter.v.price.lte=100"))).toBe(true);
    expect(isNarrowed(read("filter.v.availability=1"))).toBe(true);
  });
});

describe("toSearchParams", () => {
  it("keeps repeated parameters", () => {
    const params = toSearchParams({ "filter.p.tag": ["a", "b"], sort_by: "manual", x: undefined });
    expect(params.toString()).toBe("filter.p.tag=a&filter.p.tag=b&sort_by=manual");
  });
});

describe("facetsFrom", () => {
  const filters: ShopifyFilter[] = [
    {
      id: "filter.v.availability",
      label: "Availability",
      type: "LIST",
      values: [
        { label: "In stock", count: 9, input: '{"available":true}' },
        { label: "Out of stock", count: 9, input: '{"available":false}' },
      ],
    },
    {
      id: "filter.v.price",
      label: "Price",
      type: "PRICE_RANGE",
      values: [{ label: "Price", count: 0, input: '{"price":{"min":0,"max":449.0}}' }],
    },
    {
      id: "filter.v.option.color",
      label: "Colour",
      type: "LIST",
      values: [
        {
          label: "Black",
          count: 4,
          input: '{"variantOption":{"name":"color","value":"Black"}}',
          swatch: { color: "#1C1C1C" },
        },
        { label: "Broken", count: 1, input: "{not json" },
      ],
    },
    {
      id: "filter.p.category",
      label: "Category",
      type: "LIST",
      values: [{ label: "Shirts", count: 4, input: '{"category":{"id":"gid://x"}}' }],
    },
  ];

  it("keeps the values a URL can hold, and drops out of stock", () => {
    expect(facetsFrom(filters)).toEqual({
      lists: [
        {
          id: "filter.v.availability",
          label: "Availability",
          values: [{ label: "In stock", count: 9, param: ["filter.v.availability", "1"] }],
        },
        {
          id: "filter.v.option.color",
          label: "Colour",
          values: [
            {
              label: "Black",
              count: 4,
              param: ["filter.v.option.color", "Black"],
              swatch: "#1C1C1C",
            },
          ],
        },
      ],
      price: { label: "Price", ceiling: 449 },
    });
  });

  it("gives back params that readBrowse reads as chosen", () => {
    const [black] = facetsFrom(filters).lists[1]!.values;
    expect(isChosen(read("filter.v.option.color=Black"), black!.param)).toBe(true);
    expect(isChosen(read("filter.v.option.color=White"), black!.param)).toBe(false);
  });
});
