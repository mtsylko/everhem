import type { CatalogProduct } from "../src/catalog/types.ts";

/** Care steps shared by the products of one fabric, in every language the catalog has. */
const care = {
  cotton: {
    en: [
      "Machine wash at 30°C with similar colours",
      "Do not tumble dry",
      "Iron on low heat, inside out",
    ],
    pl: [
      "Prać w pralce w 30°C z podobnymi kolorami",
      "Nie suszyć w suszarce bębnowej",
      "Prasować w niskiej temperaturze, na lewej stronie",
    ],
  },
  fleece: {
    en: ["Machine wash at 30°C, inside out", "Do not tumble dry", "Do not iron print or drawcords"],
    pl: [
      "Prać w pralce w 30°C, na lewej stronie",
      "Nie suszyć w suszarce bębnowej",
      "Nie prasować nadruku ani sznurków",
    ],
  },
  linen: {
    en: [
      "Machine wash at 30°C on a gentle cycle",
      "Line dry in the shade",
      "Iron on medium heat while slightly damp",
    ],
    pl: [
      "Prać w pralce w 30°C w programie delikatnym",
      "Suszyć na sznurze, w cieniu",
      "Prasować w średniej temperaturze, gdy jest lekko wilgotny",
    ],
  },
  wool: {
    en: [
      "Hand wash cold or use a wool cycle",
      "Dry flat, away from direct heat",
      "Do not tumble dry",
      "Steam to refresh between wears",
    ],
    pl: [
      "Prać ręcznie w zimnej wodzie lub w programie do wełny",
      "Suszyć na płasko, z dala od źródeł ciepła",
      "Nie suszyć w suszarce bębnowej",
      "Odświeżać parą między noszeniami",
    ],
  },
};

export const products: readonly CatalogProduct[] = [
  {
    handle: "essential-crew-tee",
    title: "Essential Crew Tee",
    collection: "tees",
    productType: "T-Shirt",
    garment: "tee",
    code: "ECT",
    price: "79.00",
    colors: ["White", "Black", "Heather Grey"],
    descriptionHtml:
      "<p>The T-shirt we wear most. Mid-weight organic cotton jersey with a regular fit and a narrow, flat-lying neck rib.</p><p>Pre-washed, so it keeps its shape and size after many washes.</p>",
    fabric: "100% organic cotton, 180 g/m² jersey",
    care: care.cotton.en,
    stock: {
      kind: "in-stock",
      soldOut: [
        { color: "White", size: "XS" },
        { color: "Heather Grey", size: "XL" },
      ],
    },
    featured: "Bestseller",
    tags: ["organic-cotton", "bestseller"],
    translations: {
      pl: {
        title: "T-shirt Essential",
        descriptionHtml:
          "<p>T-shirt, który nosimy najczęściej. Średniej grubości dzianina z bawełny organicznej, regularny krój i wąski, płasko leżący ściągacz przy dekolcie.</p><p>Wstępnie uprany, więc po wielu praniach zachowuje kształt i rozmiar.</p>",
        fabric: "100% bawełna organiczna, dzianina 180 g/m²",
        care: care.cotton.pl,
      },
    },
  },
  {
    handle: "heavyweight-boxy-tee",
    title: "Heavyweight Boxy Tee",
    collection: "tees",
    productType: "T-Shirt",
    garment: "tee",
    code: "HBT",
    price: "119.00",
    colors: ["Ecru", "Washed Black"],
    descriptionHtml:
      "<p>A dense, structured tee with a boxy body and dropped shoulders. The heavier jersey holds its shape and gets softer with every wash.</p><p>Size down for a closer fit.</p>",
    fabric: "100% cotton, 240 g/m² jersey",
    care: care.cotton.en,
    stock: { kind: "in-stock", soldOut: [{ color: "Ecru", size: "M" }] },
    tags: ["heavyweight"],
    translations: {
      pl: {
        title: "Gruby T-shirt Boxy",
        descriptionHtml:
          "<p>Gęsty T-shirt o pudełkowym kroju z obniżonymi ramionami. Cięższa dzianina trzyma formę i z każdym praniem staje się bardziej miękka.</p><p>Jeśli wolisz bliżej przylegający fason, wybierz mniejszy rozmiar.</p>",
        fabric: "100% bawełna, dzianina 240 g/m²",
        care: care.cotton.pl,
      },
    },
  },
  {
    handle: "pima-long-sleeve-tee",
    title: "Pima Long Sleeve Tee",
    collection: "tees",
    productType: "Long Sleeve T-Shirt",
    garment: "long-sleeve",
    code: "PLS",
    price: "139.00",
    colors: ["Navy", "Off-White", "Olive"],
    descriptionHtml:
      "<p>Long-staple Pima cotton gives this tee a smooth surface and a light sheen. Slim through the body with ribbed cuffs.</p><p>Good on its own or under a knit.</p>",
    fabric: "100% Pima cotton, 200 g/m² jersey",
    care: care.cotton.en,
    stock: { kind: "in-stock" },
    translations: {
      pl: {
        title: "Koszulka Pima z długim rękawem",
        descriptionHtml:
          "<p>Długowłóknista bawełna Pima daje gładką powierzchnię i delikatny połysk. Dopasowana w tułowiu, z prążkowanymi mankietami.</p><p>Dobra solo albo pod sweter.</p>",
        fabric: "100% bawełna Pima, dzianina 200 g/m²",
        care: care.cotton.pl,
      },
    },
  },
  {
    handle: "linen-blend-tee",
    title: "Linen Blend Tee",
    collection: "tees",
    productType: "T-Shirt",
    garment: "tee",
    code: "LBT",
    price: "149.00",
    compareAtPrice: "179.00",
    colors: ["Sand", "Sage"],
    descriptionHtml:
      "<p>Linen and cotton knitted into a light, breathable jersey with a slightly dry hand feel. Relaxed fit for warm days.</p><p>Linen creases naturally. That is part of its character.</p>",
    fabric: "55% linen, 45% cotton",
    care: care.linen.en,
    stock: { kind: "sold-out" },
    tags: ["linen", "sale"],
    translations: {
      pl: {
        title: "T-shirt z lnem",
        descriptionHtml:
          "<p>Len i bawełna połączone w lekką, przewiewną dzianinę, lekko szorstką w dotyku. Swobodny krój na ciepłe dni.</p><p>Len naturalnie się gniecie. To część jego charakteru.</p>",
        fabric: "55% len, 45% bawełna",
        care: care.linen.pl,
      },
    },
  },
  {
    handle: "everyday-hoodie",
    title: "Everyday Hoodie",
    collection: "hoodies",
    productType: "Hoodie",
    garment: "hoodie",
    code: "EVH",
    price: "249.00",
    colors: ["Charcoal", "Heather Grey", "Forest"],
    descriptionHtml:
      "<p>A brushed-back fleece hoodie with a double-layer hood, kangaroo pocket and flat cotton drawcords.</p><p>Regular fit with room for a layer underneath.</p>",
    fabric: "80% organic cotton, 20% recycled polyester, 350 g/m² brushed fleece",
    care: care.fleece.en,
    stock: {
      kind: "in-stock",
      soldOut: [
        { color: "Forest", size: "XS" },
        { color: "Charcoal", size: "XL" },
      ],
    },
    tags: ["organic-cotton", "bestseller"],
    translations: {
      pl: {
        title: "Bluza Everyday z kapturem",
        descriptionHtml:
          "<p>Bluza z drapanej dresówki z podwójnym kapturem, kieszenią kangurką i płaskimi bawełnianymi sznurkami.</p><p>Regularny krój, z miejscem na warstwę pod spodem.</p>",
        fabric: "80% bawełna organiczna, 20% poliester z recyklingu, drapana dresówka 350 g/m²",
        care: care.fleece.pl,
      },
    },
  },
  {
    handle: "zip-through-hoodie",
    title: "Zip-Through Hoodie",
    collection: "hoodies",
    productType: "Hoodie",
    garment: "zip-hoodie",
    code: "ZTH",
    price: "279.00",
    colors: ["Black", "Oatmeal"],
    descriptionHtml:
      "<p>Loopback cotton with a two-way metal zip, split pockets and a lined hood. Easy to throw on over a tee.</p><p>Regular fit, true to size.</p>",
    fabric: "100% organic cotton, 330 g/m² loopback",
    care: care.fleece.en,
    stock: { kind: "in-stock" },
    featured: "New",
    tags: ["organic-cotton"],
    translations: {
      pl: {
        title: "Rozpinana bluza z kapturem",
        descriptionHtml:
          "<p>Bawełniana dresówka pętelkowa z dwukierunkowym metalowym zamkiem, kieszeniami po bokach i podszytym kapturem. Łatwo narzucić ją na T-shirt.</p><p>Regularny krój, rozmiar zgodny z tabelą.</p>",
        fabric: "100% bawełna organiczna, dresówka pętelkowa 330 g/m²",
        care: care.fleece.pl,
      },
    },
  },
  {
    handle: "heavyweight-oversized-hoodie",
    title: "Heavyweight Oversized Hoodie",
    collection: "hoodies",
    productType: "Hoodie",
    garment: "hoodie",
    code: "HOH",
    price: "329.00",
    colors: ["Washed Black", "Stone"],
    descriptionHtml:
      "<p>Our heaviest fleece, garment-dyed for a soft, lived-in colour. Oversized body, dropped shoulders and a deep hood.</p><p>Take your usual size for the intended oversized fit.</p>",
    fabric: "100% cotton, 460 g/m² fleece",
    care: care.fleece.en,
    stock: { kind: "sold-out" },
    tags: ["heavyweight"],
    translations: {
      pl: {
        title: "Gruba bluza oversize z kapturem",
        descriptionHtml:
          "<p>Nasza najgrubsza dresówka, barwiona po uszyciu, więc kolor jest miękki jak po latach noszenia. Obszerny krój, obniżone ramiona i głęboki kaptur.</p><p>Wybierz swój zwykły rozmiar, a bluza będzie luźna, tak jak powinna.</p>",
        fabric: "100% bawełna, dresówka 460 g/m²",
        care: care.fleece.pl,
      },
    },
  },
  {
    handle: "lightweight-hoodie",
    title: "Lightweight Hoodie",
    collection: "hoodies",
    productType: "Hoodie",
    garment: "hoodie",
    code: "LWH",
    price: "229.00",
    compareAtPrice: "269.00",
    colors: ["Navy", "Ecru", "Dusty Blue"],
    descriptionHtml:
      "<p>French terry hoodie for spring evenings and warm offices. Lighter than our fleece, with the same clean shape.</p><p>Regular fit.</p>",
    fabric: "100% cotton, 280 g/m² French terry",
    care: care.cotton.en,
    stock: { kind: "in-stock", soldOut: [{ color: "Dusty Blue", size: "S" }] },
    tags: ["sale"],
    translations: {
      pl: {
        title: "Lekka bluza z kapturem",
        descriptionHtml:
          "<p>Bluza z dresówki pętelkowej na wiosenne wieczory i ciepłe biura. Lżejsza od naszych drapanych bluz, o tym samym prostym kształcie.</p><p>Regularny krój.</p>",
        fabric: "100% bawełna, dresówka pętelkowa 280 g/m²",
        care: care.cotton.pl,
      },
    },
  },
  {
    handle: "merino-crew-sweater",
    title: "Merino Crew Sweater",
    collection: "knitwear",
    productType: "Sweater",
    garment: "sweater",
    code: "MCS",
    price: "349.00",
    colors: ["Camel", "Charcoal", "Navy"],
    descriptionHtml:
      "<p>A fine-gauge crew neck in extra-fine merino. Warm without bulk, and soft enough to wear next to skin.</p><p>Regular fit with ribbed neck, cuffs and hem.</p>",
    fabric: "100% extra-fine merino wool",
    care: care.wool.en,
    stock: { kind: "in-stock", soldOut: [{ color: "Camel", size: "M" }] },
    tags: ["merino"],
    translations: {
      pl: {
        title: "Sweter z wełny merino",
        descriptionHtml:
          "<p>Cienki sweter z okrągłym dekoltem z najdelikatniejszej wełny merino. Grzeje, nie dodając objętości, i jest tak miękki, że można go nosić na gołą skórę.</p><p>Regularny krój, prążkowany dekolt, mankiety i dół.</p>",
        fabric: "100% wełna merino extra fine",
        care: care.wool.pl,
      },
    },
  },
  {
    handle: "cotton-cardigan",
    title: "Cotton Cardigan",
    collection: "knitwear",
    productType: "Cardigan",
    garment: "cardigan",
    code: "CCA",
    price: "299.00",
    colors: ["Ecru", "Black"],
    descriptionHtml:
      "<p>A V-neck cardigan in a mid-weight organic cotton knit with horn-effect buttons. Works as a light jacket in spring.</p><p>Regular fit.</p>",
    fabric: "100% organic cotton",
    care: care.cotton.en,
    stock: { kind: "in-stock" },
    tags: ["organic-cotton"],
    translations: {
      pl: {
        title: "Bawełniany kardigan",
        descriptionHtml:
          "<p>Kardigan z dekoltem w szpic ze średniej grubości dzianiny z bawełny organicznej, z guzikami imitującymi róg. Wiosną sprawdzi się jako lekka kurtka.</p><p>Regularny krój.</p>",
        fabric: "100% bawełna organiczna",
        care: care.cotton.pl,
      },
    },
  },
  {
    handle: "cashmere-blend-turtleneck",
    title: "Cashmere Blend Turtleneck",
    collection: "knitwear",
    productType: "Sweater",
    garment: "turtleneck",
    code: "CBT",
    price: "449.00",
    compareAtPrice: "529.00",
    colors: ["Oatmeal", "Black"],
    descriptionHtml:
      "<p>Wool and cashmere spun together for a soft, warm turtleneck that keeps its shape. The fold-over collar sits close to the neck.</p><p>Slim fit.</p>",
    fabric: "70% wool, 30% cashmere",
    care: care.wool.en,
    stock: {
      kind: "in-stock",
      soldOut: [
        { color: "Black", size: "XS" },
        { color: "Oatmeal", size: "XL" },
      ],
    },
    featured: "Staff pick",
    tags: ["cashmere", "sale"],
    translations: {
      pl: {
        title: "Golf z kaszmirem",
        descriptionHtml:
          "<p>Wełna i kaszmir przędzone razem w miękki, ciepły golf, który trzyma formę. Wywijany kołnierz przylega blisko szyi.</p><p>Dopasowany krój.</p>",
        fabric: "70% wełna, 30% kaszmir",
        care: care.wool.pl,
      },
    },
  },
  {
    handle: "chunky-rib-sweater",
    title: "Chunky Rib Sweater",
    collection: "knitwear",
    productType: "Sweater",
    garment: "sweater",
    code: "CRS",
    price: "379.00",
    colors: ["Cream", "Moss", "Chocolate"],
    descriptionHtml:
      "<p>A thick rib knit with a relaxed body and a high crew neck. Cotton keeps it breathable, wool adds warmth and bounce.</p><p>Relaxed fit.</p>",
    fabric: "60% cotton, 40% wool",
    care: care.wool.en,
    stock: { kind: "sold-out" },
    translations: {
      pl: {
        title: "Sweter w gruby prążek",
        descriptionHtml:
          "<p>Gruby prążkowany splot, swobodny krój i wysoki okrągły dekolt. Bawełna zapewnia przewiewność, wełna dodaje ciepła i sprężystości.</p><p>Swobodny krój.</p>",
        fabric: "60% bawełna, 40% wełna",
        care: care.wool.pl,
      },
    },
  },
];
