import type { ProductCardFragment } from "../../generated/storefront.generated";
import { ProductTile } from "./product-tile";

/** Every seventh specimen is shown at double size, so the grid reads as a wall, not a table. */
const DOUBLE_EVERY = 7;
/** Roughly the first screen's worth of tiles: they load eagerly. */
const FIRST_TILES = 4;

interface CatalogueProps {
  products: readonly ProductCardFragment[];
  /** When the grid starts on the first screen: its first tiles enter with the page from this step. */
  enterFrom?: number;
}

export function Catalogue({ products, enterFrom }: CatalogueProps) {
  // Sold-out pieces go last, so a double tile never shows something that can't be bought.
  const ordered = products.toSorted(
    (a, b) => Number(b.availableForSale) - Number(a.availableForSale),
  );

  return (
    <ul className="grid grid-flow-dense grid-cols-2 gap-x-2 md:grid-cols-3 lg:grid-cols-4">
      {ordered.map((product, index) => (
        <ProductTile
          key={product.id}
          product={product}
          index={index}
          double={index % DOUBLE_EVERY === 0}
          eager={index < FIRST_TILES}
          enterStep={enterFrom !== undefined && index < FIRST_TILES ? enterFrom + index : undefined}
        />
      ))}
    </ul>
  );
}
