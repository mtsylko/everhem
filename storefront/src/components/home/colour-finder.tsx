"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPlural } from "@/i18n/format";
import { useI18n } from "@/i18n/i18n-context";
import { localePath } from "@/i18n/locales";
import type { ColourEntry } from "@/lib/product/colours";

type Picture = { url: string; altText?: string | null };

/** Pick a colour, see everything that comes in it. Pointing at a name is enough on a desktop. */
export function ColourFinder({ colours }: { colours: readonly ColourEntry<Picture>[] }) {
  const { locale, dictionary } = useI18n();
  const [selected, setSelected] = useState(0);
  const colour = colours[selected];
  if (!colour) return null;

  return (
    <section
      aria-labelledby="colours-title"
      className="mt-section grid grid-cols-1 gap-y-8 px-gutter lg:min-h-[90svh] lg:grid-cols-12 lg:items-end lg:gap-x-2"
    >
      <div className="lg:col-span-5 lg:pb-[6svh]">
        <h2 id="colours-title" className="rise text-head font-medium text-muted">
          {dictionary.home.coloursTitle}
        </h2>
        <ul className="rise flex flex-wrap gap-x-6 text-head font-medium lg:block">
          {colours.map((entry, index) => (
            <li key={entry.slug}>
              <button
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                onPointerEnter={(event) => event.pointerType === "mouse" && setSelected(index)}
                onFocus={() => setSelected(index)}
                className="text-muted transition-colors duration-200 hover:text-ink aria-pressed:text-ink"
              >
                {entry.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-6 lg:col-span-7 lg:flex-row lg:items-end">
        <div className="rise relative aspect-square w-[86vw] shrink-0 overflow-hidden rounded-full bg-oatmeal lg:w-[min(64svh,40vw)]">
          {colours.map((entry, index) => {
            const picture = entry.products[0]?.image;
            if (!picture) return null;
            return (
              <Image
                key={entry.slug}
                src={picture.url}
                alt={index === selected ? (picture.altText ?? entry.name) : ""}
                fill
                sizes="(min-width: 1024px) 40vw, 86vw"
                className={`object-cover mix-blend-multiply transition-opacity duration-300 ${index === selected ? "opacity-100" : "opacity-0"}`}
              />
            );
          })}
        </div>

        <div aria-live="polite" className="w-full lg:max-w-64 lg:pb-[6svh]">
          <p className="font-medium">
            {formatPlural(locale, dictionary.home.stylesInColour, colour.products.length, {
              colour: colour.name,
              colourLower: colour.name.toLowerCase(),
            })}
          </p>
          <ul className="mt-2 space-y-1">
            {colour.products.map((product) => (
              <li key={product.handle}>
                <Link
                  href={`${localePath(locale, `/products/${product.handle}`)}?color=${colour.slug}`}
                  className="underline-offset-4 hover:underline"
                >
                  {product.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
