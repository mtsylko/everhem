import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProductCardFragment } from "../../generated/storefront.generated";
import { fieldFor } from "./fields";
import { Price } from "./price";

interface ProductTileProps {
  product: ProductCardFragment;
  index: number;
  /** A double tile spans two columns and two rows. */
  double?: boolean;
  /** Tiles above the fold load first. */
  eager?: boolean;
  /** For a tile on the first screen: it enters with the page at this step, instead of on scroll. */
  enterStep?: number;
}

/** A product as a specimen: alone on a flat field, named plainly, one fact beneath. */
export function ProductTile({
  product,
  index,
  double = false,
  eager = false,
  enterStep,
}: ProductTileProps) {
  // Only the first picture: the next ones are mostly other colours, which would read as a recolour.
  const [front] = product.images.nodes;
  const colours = product.options.find((option) => option.name === "Color")?.optionValues.length;
  const sizes = double
    ? "(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 100vw"
    : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

  return (
    <li
      className={`${enterStep === undefined ? "rise" : "enter"} ${double ? "col-span-2 row-span-2" : ""}`}
      style={enterStep === undefined ? undefined : ({ "--enter-step": enterStep } as CSSProperties)}
    >
      <Link href={`/products/${product.handle}`} className="group block">
        <div className={`relative aspect-[4/5] overflow-hidden ${fieldFor(index)}`}>
          {front && (
            <Image
              src={front.url}
              alt={front.altText ?? product.title}
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
              className="object-cover mix-blend-multiply transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
            />
          )}
          {!product.availableForSale && (
            <p className="absolute top-3 left-3 bg-ink px-2 py-1 text-small text-ground">
              Sold out
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="font-medium underline-offset-4 group-hover:underline">{product.title}</h3>
          <Price
            price={product.priceRange.minVariantPrice}
            compareAt={product.compareAtPriceRange.maxVariantPrice}
            className="shrink-0 tabular-nums"
          />
        </div>
        <p className="text-small text-muted">
          {product.fabric?.value}
          {colours && colours > 1 ? ` · ${colours} colours` : null}
        </p>
      </Link>
    </li>
  );
}
