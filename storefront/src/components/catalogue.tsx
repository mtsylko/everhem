import type { ProductCardFragment } from "../../generated/storefront.generated";
import { placeFeatured } from "@/lib/product/featured";
import { ProductTile } from "./product-tile";

/**
 * Every seventh place holds a double tile, so the grid reads as a wall, not a table. Featured
 * products fill those places, so the size says why the product is there.
 */
const DOUBLE_EVERY = 7;
/** Roughly the first screen's worth of tiles: they load eagerly. */
const FIRST_TILES = 4;

interface CatalogueProps {
  products: readonly ProductCardFragment[];
  /** When the grid starts on the first screen: its first tiles enter with the page from this step. */
  enterFrom?: number;
  /** Off when the shopper picked an order: featured products would jump out of it. */
  doubles?: boolean;
}

export function Catalogue({ products, enterFrom, doubles = true }: CatalogueProps) {
  // Sold-out pieces go last: they can't be bought, so they shouldn't lead the grid.
  const ordered = products.toSorted(
    (a, b) => Number(b.availableForSale) - Number(a.availableForSale),
  );

  const placed = doubles
    ? placeFeatured(ordered, DOUBLE_EVERY)
    : ordered.map((product) => ({ product, double: false }));

  return (
    <ul className="grid grid-flow-dense grid-cols-2 gap-x-2 md:grid-cols-3 lg:grid-cols-4">
      {placed.map(({ product, double }, index) => (
        <ProductTile
          key={product.id}
          product={product}
          index={index}
          double={double}
          eager={index < FIRST_TILES}
          enterStep={enterFrom !== undefined && index < FIRST_TILES ? enterFrom + index : undefined}
        />
      ))}
    </ul>
  );
}
