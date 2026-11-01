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
        <LocaleSwitcher />
        <CartButton />
      </div>
    </header>
  );
}
