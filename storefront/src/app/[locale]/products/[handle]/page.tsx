import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Price } from "@/components/price";
import {
  Gallery,
  GalleryView,
  Purchase,
  PurchaseView,
  type Product,
} from "@/components/product/product-client";
import { ProductTile } from "@/components/product-tile";
import { format } from "@/i18n/format";
import { localePath } from "@/i18n/locales";
import { alternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { orderGallery, resolveSelection } from "@/lib/product/variants";
import {
  getCollection,
  getCollectionProducts,
  getProduct,
  getProductHandles,
} from "@/lib/shopify/catalog";

const RELATED_COUNT = 4;

export async function generateStaticParams() {
  const products = await getProductHandles();
  return products.map(({ handle }) => ({ handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};
  const image = product.images.nodes[0];
  return {
    title: product.seo.title ?? product.title,
    description: product.seo.description ?? product.description,
    openGraph: image
      ? { images: [{ url: image.url, width: image.width ?? undefined, alt: image.altText ?? "" }] }
      : undefined,
    alternates: alternates(await getLocale(), `/products/${handle}`),
  };
}

export default async function ProductPage({ params }: PageProps<"/[locale]/products/[handle]">) {
  const { loading } = await getDictionary();
  return (
    <Suspense fallback={<p className="px-gutter py-section">{loading}</p>}>
      <ProductDetails handle={params.then((p) => p.handle)} />
    </Suspense>
  );
}

async function ProductDetails({ handle }: { handle: Promise<string> }) {
  const [product, locale, dictionary] = await Promise.all([
    handle.then(getProduct),
    getLocale(),
    getDictionary(),
  ]);
  if (!product) notFound();

  // What the page shows before the URL is read: the first colour in stock, no size.
  const defaults = resolveSelection(product.options, product.variants.nodes, new URLSearchParams());
  const collection = product.collections.nodes[0];
  const care = parseList(product.care?.value);

  return (
    <>
      <article className="grid grid-cols-1 gap-x-2 gap-y-8 px-gutter pt-4 lg:grid-cols-12 lg:pt-6">
        {/* Entrances sit outside the Suspense boundaries, so they play once, not again on swap. */}
        <div className="enter lg:col-span-7">
          <Suspense
            fallback={
              <GalleryView
                images={orderGallery(
                  product.images.nodes,
                  product.variants.nodes,
                  "Color",
                  defaults.Color,
                )}
                title={product.title}
              />
            }
          >
            <Gallery product={product} />
          </Suspense>
        </div>

        <div className="lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:self-start">
          {collection && (
            <Link
              href={localePath(locale, `/collections/${collection.handle}`)}
              className="enter inline-block text-muted underline-offset-4 [--enter-step:1] hover:text-ink hover:underline"
            >
              {collection.title}
            </Link>
          )}
          <h1 className="enter mt-1 text-head font-medium [--enter-step:2]">{product.title}</h1>
          <Price
            price={product.priceRange.minVariantPrice}
            compareAt={product.compareAtPriceRange.maxVariantPrice}
            className="enter mt-4 text-lead tabular-nums [--enter-step:3]"
          />

          <div className="enter [--enter-step:4]">
            <Suspense fallback={<PurchaseView product={product} selection={defaults} />}>
              <Purchase product={product} />
            </Suspense>
          </div>

          <div
            className="rise mt-6 max-w-[60ch] space-y-4"
            // Written by the seed in the store's admin, not by shoppers.
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />

          <dl className="rise mt-8 space-y-6 bg-surface p-6">
            {product.fabric?.value && (
              <div>
                <dt className="font-medium">{dictionary.product.fabric}</dt>
                <dd>{product.fabric.value}</dd>
              </div>
            )}
            {care.length > 0 && (
              <div>
                <dt className="font-medium">{dictionary.product.care}</dt>
                <dd>
                  <ul>
                    {care.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </article>

      {collection && <Related collectionHandle={collection.handle} exclude={product.handle} />}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(product) }} />
    </>
  );
}

async function Related({
  collectionHandle,
  exclude,
}: {
  collectionHandle: string;
  exclude: string;
}) {
  const [collection, listing, dictionary] = await Promise.all([
    getCollection(collectionHandle),
    getCollectionProducts(collectionHandle),
    getDictionary(),
  ]);
  const products = listing?.nodes
    .filter((product) => product.handle !== exclude)
    .slice(0, RELATED_COUNT);
  if (!collection || !products?.length) return null;

  return (
    <section aria-labelledby="related-title" className="mt-section px-gutter">
      <h2 id="related-title" className="rise mb-8 text-head font-medium">
        {format(dictionary.product.more, { collectionLower: collection.title.toLowerCase() })}
      </h2>
      <ul className="grid grid-cols-2 gap-x-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductTile key={product.id} product={product} index={index + 1} />
        ))}
      </ul>
    </section>
  );
}

/** List metafields arrive as a JSON array in a string. */
function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function jsonLd(product: Product): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.nodes.map((image) => image.url),
    brand: { "@type": "Brand", name: "Everhem" },
    offers: product.variants.nodes.map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      price: variant.price.amount,
      priceCurrency: variant.price.currencyCode,
      availability: variant.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    })),
  };
  // Escaped so a "</script>" inside product text can't end the tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
