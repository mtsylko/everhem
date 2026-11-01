interface FeaturedSource {
  availableForSale: boolean;
  /** Why the product is featured, from its plainweft.featured metafield. */
  featured?: { value: string } | null;
}

export interface PlacedProduct<P> {
  product: P;
  double: boolean;
}

/** A product is featured when it has a reason and can be bought: a double tile is an invitation. */
export function isFeatured(product: FeaturedSource): boolean {
  return product.availableForSale && Boolean(product.featured?.value);
}

/**
 * Lays products out with a double tile at every `every`th place, the first one included.
 * Featured products take those places in their order, and the rest keep their order around them.
 * A featured product with no double place left stays single, and a double place with no featured
 * product left holds a single tile.
 */
export function placeFeatured<P extends FeaturedSource>(
  products: readonly P[],
  every: number,
): PlacedProduct<P>[] {
  const doublePlaces = Math.ceil(products.length / every);
  const doubles = products.filter(isFeatured).slice(0, doublePlaces);
  const singles = products.filter((product) => !doubles.includes(product));

  let nextDouble = 0;
  let nextSingle = 0;
  return products.map((_, index) =>
    index % every === 0 && nextDouble < doubles.length
      ? { product: doubles[nextDouble++]!, double: true }
      : { product: singles[nextSingle++]!, double: false },
  );
}
