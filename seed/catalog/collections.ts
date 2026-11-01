import type { CatalogCollection } from "../src/catalog/types.ts";

export const collections: readonly CatalogCollection[] = [
  {
    handle: "tees",
    title: "Tees",
    descriptionHtml:
      "<p>Clean, well-made tees, tanks and polos in natural fibres. The base layer for every day of the week.</p>",
    translations: {
      pl: {
        title: "T-shirty",
        descriptionHtml:
          "<p>Proste, starannie uszyte T-shirty, koszulki na ramiączkach i polo z naturalnych włókien. Pierwsza warstwa na każdy dzień tygodnia.</p>",
      },
    },
  },
  {
    handle: "hoodies",
    title: "Hoodies",
    descriptionHtml:
      "<p>Soft fleece and French terry hoodies and sweatshirts with a relaxed fit and no logos.</p>",
    translations: {
      pl: {
        title: "Bluzy",
        descriptionHtml:
          "<p>Bluzy z kapturem i bez z miękkiej dresówki drapanej i pętelkowej, o swobodnym kroju i bez logo.</p>",
      },
    },
  },
  {
    handle: "knitwear",
    title: "Knitwear",
    descriptionHtml:
      "<p>Merino, lambswool, cotton and cashmere knits for the colder months. Made to be worn for years.</p>",
    translations: {
      pl: {
        title: "Swetry",
        descriptionHtml:
          "<p>Swetry z wełny merino, jagnięcej, bawełny i kaszmiru na chłodniejsze miesiące. Zrobione, by nosić je latami.</p>",
      },
    },
  },
  {
    handle: "accessories",
    title: "Accessories",
    descriptionHtml:
      "<p>Beanies, scarves, socks and a canvas tote, in the same natural fibres as the rest of the range.</p>",
    translations: {
      pl: {
        title: "Dodatki",
        descriptionHtml:
          "<p>Czapki, szaliki, skarpety i płócienna torba z tych samych naturalnych włókien co reszta kolekcji.</p>",
      },
    },
  },
  {
    // Every product, so the storefront can filter and sort the whole range in one place.
    handle: "all",
    title: "All basics",
    descriptionHtml: "<p>Every tee, hoodie, knit and accessory in the range, in one place.</p>",
    conditions: [{ productStatus: { matchType: "ANY", relation: "EQUALS", values: ["ACTIVE"] } }],
    translations: {
      pl: {
        title: "Wszystkie modele",
        descriptionHtml:
          "<p>Wszystkie T-shirty, bluzy, swetry i dodatki z naszej kolekcji w jednym miejscu.</p>",
      },
    },
  },
];
