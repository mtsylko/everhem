# Everhem

A demo Shopify store for **Everhem**, a fictional brand of minimal everyday basics.

This repository holds two parts:

- **`seed/`** fills a Shopify development store with a realistic clothing catalog through the
  Admin GraphQL API.
- **`storefront/`** is a headless Next.js 16 store on the Storefront API: catalog, collection
  and product pages, a cart, and Shopify's own checkout.

## What the seed creates

- 3 collections: Tees, Hoodies, Knitwear
- 12 products, each in 2–3 colors and sizes XS–XL, which makes 150 variants
- Prices in PLN, some with compare-at prices for a sale
- SKUs such as `HEM-ECT-BLK-M`, and stock at the store's main location
- 3 sold-out products, plus some sold-out sizes in other products
- 3 images per product, with the right image linked to each color
- Product metafields for fabric composition, care instructions and the reason a product is
  featured (New, Bestseller or Staff pick), readable from the Storefront API
- Publishing of every product and collection to all of the store's sales channels. A channel
  added later, such as Headless, gets everything on the next run.

## Setup

You need Node.js 22.18 or newer (`nvm use` reads `.nvmrc`) and a Shopify development store.

1. **Create an app in the [Dev Dashboard](https://dev.shopify.com).** It needs no code. Give it
   these Admin API scopes: `write_products`, `write_inventory`, `read_locations`,
   `write_publications` and `write_files`. Release a version and install the app on your store.
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
  catalog handle, the seed stops instead of overwriting it.

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

- **Pages are static, the cart is not.** With Cache Components, catalog reads are cached
  functions (`"use cache"`, one `catalog` tag) and every page prerenders at build time. Only the
  cart is read per request: it streams into the static shell inside Suspense.
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

A development store keeps its password page, and Shopify's checkout shows it before the
checkout. The password is in the admin under **Online Store → Preferences**.

## Project layout

```
seed/
├── catalog/            # the Everhem catalog: colors, collections, products, images
├── scripts/            # placeholder image renderer (PNG encoder and rasterizer)
├── src/
│   ├── catalog/        # pure functions: variants, stock, images, checksums, productSet input
│   ├── shopify/        # auth, typed client, cost limiter, error helpers
│   ├── steps/          # preflight, metafield definitions, collections, uploads, products, publishing
│   ├── seed.ts
│   ├── teardown.ts
│   └── cli.ts
├── generated/          # GraphQL types from codegen
└── test/
storefront/
├── src/
│   ├── app/            # routes: home, collections/[handle], products/[handle]
│   ├── components/     # tiles, catalogue grid, product picker, cart drawer, home sections
│   └── lib/            # Storefront API client and queries, cart actions, variant logic, money
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
