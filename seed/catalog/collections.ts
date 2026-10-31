import type { CatalogCollection } from "../src/catalog/types.ts";

export const collections: readonly CatalogCollection[] = [
  {
    handle: "tees",
    title: "Tees",
    descriptionHtml:
      "<p>Clean, well-made T-shirts in natural fibres. The base layer for every day of the week.</p>",
    translations: {
      pl: {
        title: "T-shirty",
        descriptionHtml:
          "<p>Proste, starannie uszyte T-shirty z naturalnych włókien. Pierwsza warstwa na każdy dzień tygodnia.</p>",
      },
    },
  },
  {
    handle: "hoodies",
    title: "Hoodies",
    descriptionHtml: "<p>Soft fleece and French terry hoodies with a relaxed fit and no logos.</p>",
    translations: {
      pl: {
        title: "Bluzy",
        descriptionHtml:
          "<p>Bluzy z kapturem z miękkiej dresówki drapanej i pętelkowej, o swobodnym kroju i bez logo.</p>",
      },
    },
  },
  {
    handle: "knitwear",
    title: "Knitwear",
    descriptionHtml:
      "<p>Merino, cotton and cashmere knits for the colder months. Made to be worn for years.</p>",
    translations: {
      pl: {
        title: "Swetry",
        descriptionHtml:
          "<p>Swetry z wełny merino, bawełny i kaszmiru na chłodniejsze miesiące. Zrobione, by nosić je latami.</p>",
      },
    },
  },
];
