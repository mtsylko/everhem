# Everhem

A demo Shopify store for **Everhem**, a fictional brand of minimal everyday basics.

This repository holds two parts:

- **`seed/`** fills a Shopify development store with a realistic clothing catalog through the
  Admin GraphQL API.
- **`storefront/`** is a headless Next.js 16 store on the Storefront API: catalog, collection
  and product pages, a cart, and Shopify's own checkout.

## What the seed creates

- 3 collections: Tees, Hoodies, Knitwear
- An automatic **All basics** collection (handle `all`): Shopify adds every active product to it,
  so the storefront can filter the whole range in one place
- 12 products, each in 2–3 colors and sizes XS–XL, which makes 150 variants
- Prices in PLN, some with compare-at prices for a sale
- SKUs such as `HEM-ECT-BLK-M`, and stock at the store's main location
- 3 sold-out products, plus some sold-out sizes in other products
- 3 images per product, with the right image linked to each color
- Product metafields for fabric composition, care instructions and the reason a product is
  featured (New, Bestseller or Staff pick), readable from the Storefront API
- Publishing of every product and collection to all of the store's sales channels. A channel
  added later, such as Headless, gets everything on the next run.
- Polish as a second store language: turned on, published, and added to the markets that sell in
  English, with a translation of every product, collection, colour, fabric, care step and image
  alt text

## Setup

You need Node.js 22.18 or newer (`nvm use` reads `.nvmrc`) and a Shopify development store.

1. **Create an app in the [Dev Dashboard](https://dev.shopify.com).** It needs no code. Give it
   these Admin API scopes: `write_products`, `write_inventory`, `read_locations`,
   `write_publications`, `write_files`, `write_locales`, `write_translations` and `read_markets`.
   Release a version and install the app on your store.
2. **Copy the credentials.** Copy `seed/.env.example` to `seed/.env`, then fill in the store
   domain and the app's client ID and secret.
3. **Set the store currency to PLN.** The seed checks this before it changes anything.
4. **Install dependencies** with `npm install`.

The seed exchanges the client ID and secret for a 24-hour token on every run (the
[client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant)).
This only works when the app and the store belong to the same Shopify organization. If they
don't, set `SHOPIFY_ADMIN_TOKEN` to an Admin API access token instead.

## Commands

```bash
npm run seed                    # create or update the catalog
npm run seed -- --dry-run       # show what would change, change nothing
npm run teardown                # list what teardown would delete
npm run teardown -- --yes       # delete everything the seed created
```

A run logs one event per resource and ends with a summary. For example:

```
01:38:47 INFO  preflight.ok shop=everhem-agiecxdg.myshopify.com currency=PLN location="Shop location" publications=["Online Store","Shop","Point of Sale"]
01:38:48 INFO  collection.created handle=tees id=gid://shopify/Collection/720261906777
01:38:48 INFO  collection.published handle=tees publications=["Online Store","Shop","Point of Sale"]
01:38:52 INFO  product.created handle=essential-crew-tee id=gid://shopify/Product/16752147333465 images=3
01:38:52 INFO  product.published handle=essential-crew-tee publications=["Online Store","Shop","Point of Sale"]
...
01:38:59 INFO  run.summary durationMs=12367 metafield-definition={"created":3} collection={"created":3} product={"created":12}
```

A second run changes nothing and takes about a second:

```
01:39:48 INFO  run.summary durationMs=1286 metafield-definition={"skipped":3} collection={"skipped":3} product={"skipped":12}
```

Logs are readable lines in a terminal and JSON lines elsewhere. Set `LOG_FORMAT=json` or
`LOG_LEVEL=debug` to change that.

## How it works

### Running it twice creates no duplicates

- **Products are upserted by handle** with `productSet`.
- **Each product and collection stores a hash of its seed data** in an `everhem_seed.checksum`
  metafield. On the next run an unchanged resource is skipped, a changed one is updated in place,
  and a missing one is created. Image file contents are part of the hash, so replacing an image
  file updates its product.
- **Existing variants keep their IDs.** The seed matches them by color and size.
- **Old images don't pile up.** A changed product gets its images uploaded again, and
  `productSet` deletes the old files it no longer lists.
- **Teardown only deletes what the seed created.** A resource needs both the `everhem-seed` tag
  and the checksum metafield to count. If the store already has a product or collection with a
  catalog handle, the seed stops instead of overwriting it. Translations go with their products;
  the Polish language stays on, since it is a store setting.

### Translations

The Polish text lives next to the English in `seed/catalog/`, under each product's, collection's
and colour's `translations`. It goes into the store through Shopify's own translations
(`translationsRegister`), so the Storefront API returns it to any client that asks for Polish, and
checkout and order emails can use it too.

- **Translations run after the products.** Each one is tied to the English text it translates by
  a digest of that text, so the English has to be in the store first.
- **Unchanged translations are skipped.** The seed reads the store's translations and registers
  only the ones that differ, or that Shopify marks outdated because the English changed.
- **Option names stay English.** Colour values are translated, but the option is still called
  `Color`, which the storefront matches on.

### Rate limits

The Admin GraphQL API uses a cost-based leaky bucket. Every response reports the bucket state in
`extensions.cost.throttleStatus`. `CostLimiter` ([seed/src/shopify/throttle.ts](seed/src/shopify/throttle.ts))
keeps a local model of that bucket:

- **It refills the bucket locally** at the reported restore rate between responses.
- **It holds back requests already in flight**, so parallel requests don't overspend the bucket.
- **It makes each request wait until its cost fits.** The cost estimate is the last
  `requestedQueryCost` seen for that operation.
- **It retries `THROTTLED` responses** after a wait that comes from the fresh bucket state. There
  are no fixed sleeps.

Products sync three at a time (`--concurrency`), and the limiter keeps them within the budget.

### productSet instead of bulk operations

One `productSet` call creates a product with its options, variants, prices, inventory, images,
metafields and collection membership. For 12 products that means 12 synchronous calls, and
each result can be checked and logged right away. A bulk operation needs a JSONL upload and
polling until it finishes. That only pays off for catalogs of hundreds or thousands of products.

### Images

Product images come from local files in `seed/catalog/images/<handle>/`. They go through
`stagedUploadsCreate` and are then passed to `productSet`. A product can also list remote image
URLs in its `images` field, which Shopify downloads itself.

The current files are flat placeholders rendered from code (`npm run placeholders -w seed`), in
the exact color of each variant. To use real photos, replace the files with the same names and run
the seed again.

### Typed GraphQL

Operations are written inline with a `#graphql` tag. `npm run codegen -w seed` checks them against
the Admin API schema and generates types into `seed/generated/`. The client looks up response and
variable types by the operation string, so a typo in a field name fails the typecheck.

## Storefront

### Setup

The storefront reads the catalog with a Storefront API token from Shopify's **Headless** channel.

1. **Install the [Headless](https://apps.shopify.com/headless) channel** on the store and click
   **Create storefront**.
2. **Copy the private token.** In the storefront's **Storefront API** settings, copy the
   **private access token**. Its permissions need to cover reading products, collections and
   metafields, and writing carts.
3. **Fill in the environment.** Copy `storefront/.env.example` to `storefront/.env.local`, then
   set the store domain and the private token.
4. **Run the seed once more.** It publishes the catalog to the new Headless channel.

### Commands

```bash
npm run dev                     # dev server on http://localhost:3000
npm run build -w storefront     # production build
npm run start -w storefront     # serve the production build
```

### How it works

- **Pages are static, the cart and filtered lists are not.** With Cache Components, catalog reads
  are cached functions (`"use cache"`, one `catalog` tag) and every page prerenders at build time.
  The cart and a collection's product list are read per request: they stream into the static
  shell inside Suspense.
- **Shopify filters and sorts the collections.** A collection page sends the shopper's choice to
  the Storefront API (`filters`, `sortKey`) and builds its filter form from the filters Shopify
  returns, with a count for each value. The choice lives in the URL under Liquid's parameter
  names (`?filter.v.availability=1&filter.v.price.gte=100&sort_by=price-ascending`), so a link
  can be shared and the back button undoes a filter. The form is a plain GET form, so it works
  before JavaScript loads. Each choice is a cache entry of its own.
- **Which filters exist is set in the admin.** Without the free
  [Search & Discovery](https://apps.shopify.com/search-and-discovery) app, Shopify offers
  availability and price. Install it and add filters (Color and Size, for example) under
  **Search & Discovery → Filters**, and they appear in the form with no code change.
- **The cart lives in Shopify.** Its ID sits in an httpOnly cookie. Adding, changing and removing
  lines are Server Actions that validate their input, call the Cart API and refresh the page. The
  bag updates optimistically with `useOptimistic`, and checkout goes to the cart's `checkoutUrl`.
- **The token stays on the server.** Every Storefront API request is made by Next.js with the
  private token, never by the browser. Request-time calls send the shopper's IP in
  `Shopify-Storefront-Buyer-IP`, so Shopify's bot protection sees shoppers, not one server.
- **Link prefetches skip the cart.** Prefetches can read cookies, but they stop before Shopify
  answers. `getCart` waits for `connection()`, so only a real visit reads the cart.
- **The chosen variant is in the URL** (`?color=black&size=m`), so a link opens on that color and
  size. Picking one updates the URL with `history.replaceState`, with no server round trip.
- **Merchandising comes from the admin.** A product with an `everhem.featured` value takes one of
  the grid's double tiles, labelled with that reason. Featured products fill every seventh place,
  and a sold-out one stays single.
- **Types come from codegen**, as in the seed: `npm run codegen -w storefront` checks every
  query against the Storefront API schema.

### Languages

The storefront is in English and Polish: `/en/...` and `/pl/...`.

- **Every page prerenders once per language.** The language is the first URL segment, and the
  root layout sits under it (`app/[locale]`). Any Server Component reads it with
  `next/root-params`, and inside `"use cache"` it becomes part of the cache key.
- **A URL without a language is redirected.** The proxy picks the language the shopper chose
  before (a cookie set by the switcher), or else the first one their browser asks for.
- **Catalogue text comes from Shopify.** Every query runs `@inContext(language:)`, so Shopify
  answers with the seed's translations and falls back to English where there are none. A cart is
  created in the page's language, so its checkout is too.
- **The storefront's own words are in dictionaries** (`src/i18n/dictionaries`), typed against the
  English one, with Polish plural forms picked by `Intl.PluralRules`. Client Components get the
  page's dictionary through context; Server Actions are given the locale as an argument.
- **Search engines see each language.** Pages link their other language with `hreflang`. Set
  `SITE_URL` in `.env.local` so those links are absolute and point at the real site.

A development store keeps its password page, and Shopify's checkout shows it before the
checkout. The password is in the admin under **Online Store → Preferences**.

## Project layout

```
seed/
├── catalog/            # the Everhem catalog, in English and Polish: colors, collections, products, images
├── scripts/            # placeholder image renderer (PNG encoder and rasterizer)
├── src/
│   ├── catalog/        # pure functions: variants, stock, images, checksums, productSet input, translations
│   ├── shopify/        # auth, typed client, cost limiter, error helpers
│   ├── steps/          # preflight, locales, metafield definitions, collections, uploads, products,
│   │                   # publishing, translations
│   ├── seed.ts
│   ├── teardown.ts
│   └── cli.ts
├── generated/          # GraphQL types from codegen
└── test/
storefront/
├── src/
│   ├── app/[locale]/   # routes per language: home, collections/[handle], products/[handle]
│   ├── components/     # tiles, catalogue grid, filter form, product picker, cart drawer, home sections
│   ├── i18n/           # locales, dictionaries, message formatting
│   ├── lib/            # Storefront API client and queries, cart actions, variant and filter logic, money
│   └── proxy.ts        # sends a URL without a language to the shopper's own
├── generated/          # GraphQL types from codegen
└── test/
```

## Development

```bash
npm test                          # unit tests, no network
npm run typecheck
npm run lint
npm run format
npm run codegen -w seed           # after changing an Admin API operation
npm run codegen -w storefront     # after changing a Storefront API operation
```

Node runs the TypeScript files directly through type stripping, so there is no build step.
The Admin API version lives in [seed/src/shopify/api-version.ts](seed/src/shopify/api-version.ts).
