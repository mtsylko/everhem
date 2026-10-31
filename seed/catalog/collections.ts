import type { CatalogCollection } from "../src/catalog/types.ts";

export const collections: readonly CatalogCollection[] = [
  {
    handle: "tees",
    title: "Tees",
    descriptionHtml:
      "<p>Clean, well-made T-shirts in natural fibres. The base layer for every day of the week.</p>",
  },
  {
    handle: "hoodies",
    title: "Hoodies",
    descriptionHtml: "<p>Soft fleece and French terry hoodies with a relaxed fit and no logos.</p>",
  },
  {
    handle: "knitwear",
    title: "Knitwear",
    descriptionHtml:
      "<p>Merino, cotton and cashmere knits for the colder months. Made to be worn for years.</p>",
  },
];
