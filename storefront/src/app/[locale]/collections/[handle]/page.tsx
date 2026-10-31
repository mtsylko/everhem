import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Catalogue } from "@/components/catalogue";
import { alternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCollection, getCollections } from "@/lib/shopify/catalog";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map(({ handle }) => ({ handle }));
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
    alternates: alternates(await getLocale(), `/collections/${handle}`),
  };
}

export default async function CollectionPage({
  params,
}: PageProps<"/[locale]/collections/[handle]">) {
  const { loading } = await getDictionary();
  return (
    <Suspense fallback={<p className="px-gutter py-section">{loading}</p>}>
      <CollectionDetails handle={params.then((p) => p.handle)} />
    </Suspense>
  );
}

async function CollectionDetails({ handle }: { handle: Promise<string> }) {
  const collection = await getCollection(await handle);
  if (!collection) notFound();

  return (
    <section aria-labelledby="collection-title" className="px-gutter pt-10 lg:pt-16">
      <div className="mb-12 grid gap-4 lg:grid-cols-12 lg:gap-2">
        <h1 id="collection-title" className="enter text-head font-medium lg:col-span-6">
          {collection.title}
        </h1>
        <p className="enter max-w-[40ch] self-end text-lead [--enter-step:1] lg:col-span-5 lg:col-start-8">
          {collection.description}
        </p>
      </div>
      <Catalogue products={collection.products.nodes} enterFrom={2} />
    </section>
  );
}
