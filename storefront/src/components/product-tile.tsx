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

/**
 * A product as a specimen: alone on a flat field, named plainly, one fact beneath.
 *
 * Each tile is a subgrid over two of its list's rows, picture and caption, so a row's pictures end
 * on one line and its captions start on one. A double tile's picture runs down to the foot of the
 * second row's pictures. The tile brings its own space beneath, so its list has no row gap.
 */
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
      className={`${enterStep === undefined ? "rise" : "enter"} grid grid-rows-subgrid pb-8 ${double ? "col-span-2 row-span-4" : "row-span-2"}`}
      style={enterStep === undefined ? undefined : ({ "--enter-step": enterStep } as CSSProperties)}
    >
      <Link
        href={`/products/${product.handle}`}
        className="group row-span-full grid grid-rows-subgrid"
      >
        {/*
          A double picture keeps its 4:5 when nothing sits beside it, and stretches when tiles do.
          Stretched, it is taller than the photo, so the photo is fitted whole, not cropped at the sleeves,
          and the margins take the photo's own ground, so they blend into the field the same way.
        */}
        <div
          className={`relative aspect-[4/5] overflow-hidden ${double ? "row-span-3 place-self-stretch" : ""} ${fieldFor(index)}`}
        >
          {front && (
            <Image
              src={front.url}
              alt={front.altText ?? product.title}
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
              className={`${double ? "object-contain bg-backdrop" : "object-cover"} mix-blend-multiply transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]`}
            />
          )}
          {!product.availableForSale && (
            <p className="absolute top-3 left-3 bg-ink px-2 py-1 text-small text-ground">
              Sold out
            </p>
          )}
        </div>
        <div className="pt-3">
          <h3 className="font-medium underline-offset-4 group-hover:underline">{product.title}</h3>
          <Price
            price={product.priceRange.minVariantPrice}
            compareAt={product.compareAtPriceRange.maxVariantPrice}
            className="tabular-nums"
          />
          {/* The colour count holds on to the fabric's last word, so it never wraps alone. */}
          <p className="mt-1 text-small text-pretty text-muted">
            {product.fabric?.value}
            {colours && colours > 1 ? `\u00a0·\u00a0${colours}\u00a0colours` : null}
          </p>
        </div>
      </Link>
    </li>
  );
}
