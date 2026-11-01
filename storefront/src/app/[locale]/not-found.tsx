import type { Metadata } from "next";
import Link from "next/link";
import { localePath } from "@/i18n/locales";
import { getDictionary, getLocale } from "@/i18n/server";
import { ALL_COLLECTION } from "@/lib/shopify/catalog";

/** The tab says the page is missing, not the home page's title. */
export async function generateMetadata(): Promise<Metadata> {
  const { notFound } = await getDictionary();
  return { title: notFound.title };
}

export default async function NotFound() {
  const [locale, { notFound }] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <section className="grid min-h-[60svh] content-center gap-6 px-gutter">
      <h1 className="text-head font-medium">{notFound.title}</h1>
      <p className="max-w-[40ch]">{notFound.body}</p>
      <Link
        href={localePath(locale, `/collections/${ALL_COLLECTION}`)}
        className="justify-self-start bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent hover:text-accent-ink active:scale-[0.98]"
      >
        {notFound.back}
      </Link>
    </section>
  );
}
