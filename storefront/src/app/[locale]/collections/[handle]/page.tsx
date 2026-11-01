import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Catalogue } from "@/components/catalogue";
import { BrowseForm } from "@/components/collection/browse-form";
import { formatPlural } from "@/i18n/format";
import { localePath } from "@/i18n/locales";
import { alternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import {
  DEFAULT_BROWSE,
  DEFAULT_SORT,
  facetsFrom,
  isNarrowed,
  readBrowse,
  searchFor,
  toSearchParams,
} from "@/lib/product/browse";
import {
  ALL_COLLECTION,
  getCollection,
  getCollectionProducts,
  getCollections,
} from "@/lib/shopify/catalog";

export async function generateStaticParams() {
  const collections = await getCollections();
  return [...collections, { handle: ALL_COLLECTION }].map(({ handle }) => ({ handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollection(handle);
  if (!collection) return {};
  return {
    title: collection.seo.title ?? collection.title,
    description: collection.seo.description ?? collection.description,
    // Filtered addresses point search engines at the collection itself.
    alternates: alternates(await getLocale(), `/collections/${handle}`),
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/[locale]/collections/[handle]">) {
  const { loading } = await getDictionary();
  const handle = params.then((p) => p.handle);
  return (
    <section aria-labelledby="collection-title" className="px-gutter pt-10 lg:pt-16">
      <Suspense fallback={<p>{loading}</p>}>
        <CollectionHeading handle={handle} />
      </Suspense>
      {/* The heading is prerendered; the products depend on the query, so they render per request. */}
      <Suspense fallback={<p>{loading}</p>}>
        <CollectionProducts handle={handle} query={searchParams.then(toSearchParams)} />
      </Suspense>
    </section>
  );
}

async function CollectionHeading({ handle }: { handle: Promise<string> }) {
  const collection = await getCollection(await handle);
  if (!collection) notFound();

  return (
    <div className="mb-12 grid gap-4 lg:grid-cols-12 lg:gap-2">
      <h1 id="collection-title" className="enter text-head font-medium lg:col-span-6">
        {collection.title}
      </h1>
      <p className="enter max-w-[40ch] self-end text-lead [--enter-step:1] lg:col-span-5 lg:col-start-8">
        {collection.description}
      </p>
    </div>
  );
}

async function CollectionProducts({
  handle,
  query,
}: {
  handle: Promise<string>;
  query: Promise<URLSearchParams>;
}) {
  const browse = readBrowse(await query);
  const [listing, locale, { browse: words }] = await Promise.all([
    getCollectionProducts(await handle, browse),
    getLocale(),
    getDictionary(),
  ]);
  // The heading beside this shows the 404 for a collection that doesn't exist.
  if (!listing) return null;

  const products = listing.nodes;
  const { lists, price } = facetsFrom(listing.filters);
  const path = localePath(locale, `/collections/${await handle}`);
  const cleared = `${path}${searchFor({ ...DEFAULT_BROWSE, sortBy: browse.sortBy })}`;

  return (
    <div className="group">
      <BrowseForm
        path={path}
        browse={browse}
        lists={lists}
        price={price}
        currency={listing.currency}
      />
      <div className="mt-8 mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p role="status" className="text-muted">
          {formatPlural(locale, words.results, products.length)}
        </p>
        {isNarrowed(browse) && (
          <Link href={cleared} scroll={false} className="underline underline-offset-4">
            {words.clear}
          </Link>
        )}
      </div>
      <div className="transition-opacity group-has-data-pending:opacity-40">
        {products.length > 0 ? (
          <Catalogue products={products} enterFrom={2} doubles={browse.sortBy === DEFAULT_SORT} />
        ) : (
          <p className="max-w-[40ch] pb-section text-lead">{words.empty}</p>
        )}
      </div>
    </div>
  );
}
