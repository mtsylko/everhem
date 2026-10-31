import Link from "next/link";
import { getCollections } from "@/lib/shopify/catalog";
import { CartButton } from "./cart/cart-button";

export async function Header() {
  const collections = await getCollections();

  return (
    <header className="z-20 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 bg-ground px-gutter py-4 md:sticky md:top-0">
      <Link href="/" className="text-lead font-semibold tracking-tight">
        Everhem
      </Link>
      <nav
        aria-label="Collections"
        className="order-last w-full md:order-none md:mr-auto md:w-auto"
      >
        <ul className="flex gap-6">
          {collections.map((collection) => (
            <li key={collection.handle}>
              <Link
                href={`/collections/${collection.handle}`}
                className="underline-offset-4 hover:underline"
              >
                {collection.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <CartButton />
    </header>
  );
}
