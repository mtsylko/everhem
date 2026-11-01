import Link from "next/link";
import type { ProductCardFragment } from "../../../generated/storefront.generated";
import { Catalogue } from "@/components/catalogue";
import { getDictionary } from "@/i18n/server";
import {
  DEFAULT_SORT,
  facetsFrom,
  isNarrowed,
  searchFor,
  type Browse,
  type ShopifyFilter,
} from "@/lib/product/browse";
import { BrowseForm } from "./browse-form";

interface BrowseListingProps {
  /** The page being browsed, without its query. */
  path: string;
  browse: Browse;
  /** The products Shopify found, with the filters it offers for them. */
  listing: {
    filters: readonly ShopifyFilter[];
    nodes: readonly ProductCardFragment[];
    currency: string;
  };
  /** The count line above the grid. */
  status: string;
}

/** A list of products the shopper can narrow and sort: a collection, or search results. */
export async function BrowseListing({ path, browse, listing, status }: BrowseListingProps) {
  const { browse: words } = await getDictionary();
  const { lists, price } = facetsFrom(listing.filters);
  const cleared = `${path}${searchFor({ ...browse, values: [], price: {} })}`;
  const isCollection = browse.scope === "collection";

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
          {status}
        </p>
        {isNarrowed(browse) && (
          <Link href={cleared} scroll={false} className="underline underline-offset-4">
            {words.clear}
          </Link>
        )}
      </div>
      <div className="transition-opacity group-has-data-pending:opacity-40">
        {listing.nodes.length > 0 ? (
          // Search results keep Shopify's ranking, so no double tiles, and no entrance, as they
          // change while the shopper types.
          <Catalogue
            products={listing.nodes}
            enterFrom={isCollection ? 2 : undefined}
            doubles={isCollection && browse.sortBy === DEFAULT_SORT.collection}
          />
        ) : (
          <p className="max-w-[40ch] pb-section text-lead">{words.empty}</p>
        )}
      </div>
    </div>
  );
}
