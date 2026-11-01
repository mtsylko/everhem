import Link from "next/link";
import { localePath } from "@/i18n/locales";
import { getDictionary, getLocale } from "@/i18n/server";
import { ALL_COLLECTION, getCollections } from "@/lib/shopify/catalog";
import { CartButton } from "./cart/cart-button";
import { LocaleSwitcher } from "./locale-switcher";

export async function Header() {
  const [collections, locale, { layout }] = await Promise.all([
    getCollections(),
    getLocale(),
    getDictionary(),
  ]);

  return (
    <header className="z-20 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 bg-ground px-gutter py-4 md:sticky md:top-0">
      <Link href={localePath(locale)} className="text-lead font-semibold tracking-tight">
        Everhem
      </Link>
      <nav
        aria-label={layout.collections}
        className="order-last w-full md:order-none md:mr-auto md:w-auto"
      >
        <ul className="flex flex-wrap gap-x-6">
          {[{ handle: ALL_COLLECTION, title: layout.allBasics }, ...collections].map(
            (collection) => (
              <li key={collection.handle}>
                <Link
                  href={localePath(locale, `/collections/${collection.handle}`)}
                  className="underline-offset-4 hover:underline"
                >
                  {collection.title}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
      <div className="flex items-center gap-6">
        <Link
          href={localePath(locale, "/search")}
          className="font-medium underline-offset-4 hover:underline"
        >
          {/* A phone's first row only fits the logo, the languages and the bag beside a glass. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 md:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <span className="sr-only md:not-sr-only">{layout.search}</span>
        </Link>
        <LocaleSwitcher />
        <CartButton />
      </div>
    </header>
  );
}
