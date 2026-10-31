import { describe, expect, it } from "vitest";
import { groupByColour } from "../src/lib/product/colours";

function product(handle: string, colours: [string, boolean][]) {
  return {
    handle,
    title: handle,
    variants: {
      nodes: colours.flatMap(([colour, inStock]) =>
        ["S", "M"].map((size) => ({
          availableForSale: inStock,
          selectedOptions: [
            { name: "Color", value: colour },
            { name: "Size", value: size },
          ],
          image: { url: `${handle}-${colour}.png` },
        })),
      ),
    },
  };
}

describe("groupByColour", () => {
  const groups = groupByColour([
    product("tee", [
      ["White", true],
      ["Black", true],
    ]),
    product("hoodie", [
      ["Black", true],
      ["Forest", false],
    ]),
  ]);

  it("puts the colours shared by most products first", () => {
    expect(groups.map((group) => group.name)).toEqual(["Black", "White"]);
  });

  it("lists each product once per colour, with that colour's picture", () => {
    expect(groups[0]).toEqual({
      name: "Black",
      slug: "black",
      products: [
        { handle: "tee", title: "tee", image: { url: "tee-Black.png" } },
        { handle: "hoodie", title: "hoodie", image: { url: "hoodie-Black.png" } },
      ],
    });
  });

  it("leaves out colours that are sold out everywhere", () => {
    expect(groups.some((group) => group.name === "Forest")).toBe(false);
  });
});
