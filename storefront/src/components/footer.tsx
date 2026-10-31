import Link from "next/link";
import { getCollections } from "@/lib/shopify/catalog";

const REPOSITORY = "https://github.com/mtsylko/everhem";

/** The close of the page: the last two rows of the specimen board. */
export async function Footer() {
  const collections = await getCollections();

  return (
    <footer className="mt-section grid grid-cols-2 gap-2 p-2 lg:grid-cols-12">
      <div className="rise order-6 col-span-2 flex flex-col justify-between gap-8 bg-surface p-5 md:col-span-1 lg:order-none lg:col-span-4 lg:h-56 lg:p-6">
        <p className="text-lead">
          Everhem is a demo store: a headless Next.js storefront on Shopify.
        </p>
        <p className="text-small text-muted">
          A fictional brand. Orders go to a Shopify development store and are never shipped.
        </p>
      </div>

      <nav
        aria-label="Footer"
        className="rise order-3 bg-oatmeal p-5 lg:order-none lg:col-span-3 lg:h-56 lg:p-6"
      >
        <ul className="space-y-1">
          <li>
            <Link href="/#catalogue" className="underline-offset-4 hover:underline">
              All basics
            </Link>
          </li>
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

      <p className="rise order-5 col-span-2 bg-sage p-5 md:col-span-1 lg:order-none lg:col-span-2 lg:h-56 lg:p-6">
        Built with Next.js 16, React 19 and the Shopify Storefront API.
      </p>

      <div className="rise order-4 flex flex-col justify-end bg-stone p-5 lg:order-none lg:col-span-3 lg:h-56 lg:p-6">
        <a href={REPOSITORY} className="text-lead underline-offset-4 hover:underline">
          Source on GitHub
        </a>
      </div>

      <p
        aria-hidden="true"
        className="rise order-1 col-span-2 flex h-40 items-center justify-center overflow-hidden bg-ink text-display font-medium text-ground lg:order-none lg:col-span-8 lg:h-80"
      >
        Everhem
      </p>

      <Link
        href="/#catalogue"
        className="rise group order-2 col-span-2 flex h-40 flex-col justify-between bg-accent p-5 text-accent-ink transition-colors hover:bg-accent-strong lg:order-none lg:col-span-4 lg:h-80 lg:p-6"
      >
        <span className="text-head font-medium">Shop the basics</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="size-12 self-end transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          <path d="M10 38 38 10M16 10h22v22" />
        </svg>
      </Link>
    </footer>
  );
}
