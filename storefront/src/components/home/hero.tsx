import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CollectionsQuery } from "../../../generated/storefront.generated";
import { formatMoney, lowestPrice } from "@/lib/money";
import { fieldFor } from "../fields";

type Collection = CollectionsQuery["collections"]["nodes"][number];

interface HeroProps {
  /** Product pictures for the wall, in catalogue order. */
  images: readonly { url: string }[];
  collections: readonly Collection[];
}

const ROWS = 8;
const TILES_PER_ROW = 14;

/** The whole catalogue as a wall of specimens, with one panel that says what it is. */
export function Hero({ images, collections }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="flex flex-col [--tile:22vw] [--wall-space:62svh] md:relative md:[--tile:7.8vw] md:[--wall-space:max(38rem,100svh_-_4.5rem)]"
    >
      <Wall images={images} />

      <div className="grid gap-x-8 gap-y-5 bg-ink p-5 text-ground md:absolute md:bottom-6 md:left-1/2 md:w-[min(64rem,calc(100%-2*var(--spacing-gutter)))] md:-translate-x-1/2 md:grid-cols-[1fr_auto] md:items-end md:p-8">
        <h1 id="hero-title" className="text-title font-medium text-balance md:col-span-2">
          Everyday basics in natural fibres
        </h1>
        <p className="max-w-[36ch] text-lead text-pretty">
          Organic cotton, linen, merino and cashmere, made to last.
        </p>
        <Link
          href="#catalogue"
          className="bg-ground px-6 py-3 text-center font-medium text-ink transition-colors hover:bg-ecru active:scale-[0.98]"
        >
          Shop the basics
        </Link>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-small md:col-span-2">
          {collections.map((collection) => {
            const from = lowestPrice(
              collection.products.nodes.map((product) => product.priceRange.minVariantPrice),
            );
            return (
              <li key={collection.handle}>
                <Link
                  href={`/collections/${collection.handle}`}
                  className="underline-offset-4 hover:underline"
                >
                  {collection.title}
                  {from && ` from ${formatMoney(from)}`}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Wall({ images }: { images: HeroProps["images"] }) {
  if (images.length === 0) return null;

  const rows = Array.from({ length: ROWS }, (_, row) =>
    Array.from(
      { length: TILES_PER_ROW },
      (_, column) => images[(row * 5 + column) % images.length]!,
    ),
  );

  return (
    <div
      aria-hidden="true"
      className="wall flex flex-col gap-(--wall-gap) overflow-hidden"
      style={{ "--wall-rows": ROWS } as CSSProperties}
    >
      {rows.map((tiles, row) => (
        <div
          key={row}
          // Every other row is set half a tile to the left, like courses of brick.
          className={`flex w-max shrink-0 gap-(--wall-gap) ${row % 2 ? "-ml-[calc(var(--tile)/2)]" : ""}`}
        >
          {tiles.map((image, index) => (
            <div
              key={index}
              className={`relative size-(--tile) shrink-0 overflow-hidden ${fieldFor(row + index)}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="(min-width: 768px) 8vw, 22vw"
                loading={row < 4 ? "eager" : "lazy"}
                className="object-cover mix-blend-multiply"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
