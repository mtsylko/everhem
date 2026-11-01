"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/i18n-context";
import {
  isChosen,
  readBrowse,
  searchFor,
  SORTS,
  TERMS,
  type Browse,
  type ListFacet,
  type PriceFacet,
  type SortBy,
} from "@/lib/product/browse";

interface BrowseFormProps {
  /** The page being browsed, without its query: where the form sends the choice. */
  path: string;
  browse: Browse;
  lists: readonly ListFacet[];
  price: PriceFacet | null;
  /** The store currency's symbol, shown in the price fields. */
  currency: string;
}

/**
 * The filter and sort form. It is a plain GET form, so it works before JavaScript loads. After that,
 * a ticked box or a new sort navigates at once, without a page load, and sets `data-pending` so the
 * page can dim the old results until the new ones arrive.
 */
export function BrowseForm({ path, browse, lists, price, currency }: BrowseFormProps) {
  const router = useRouter();
  const words = useI18n().dictionary.browse;
  const sorts = Object.keys(SORTS[browse.scope]) as SortBy[];
  // A choice shows the moment it's made; the URL catches up when the navigation lands.
  const [shown, setShown] = useOptimistic(browse);
  const [pending, setPending] = useOptimistic(false);
  // The price fields keep what's typed until it's sent, and follow the URL again after.
  const [draft, setDraft] = useState(() => priceDraft(browse));
  const [synced, setSynced] = useState(browse);
  if (synced !== browse) {
    setSynced(browse);
    setDraft(priceDraft(browse));
  }

  // Like a native submit, every change sends the whole form, a typed price included.
  function send(form: HTMLFormElement | null) {
    if (!form) return;
    const fields = [...new FormData(form)].filter(
      (field): field is [string, string] => typeof field[1] === "string",
    );
    const next = readBrowse(new URLSearchParams(fields), browse.scope);
    startTransition(() => {
      setShown(next);
      setPending(true);
      router.push(`${path}${searchFor(next)}`, { scroll: false });
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(event.currentTarget);
  }

  return (
    <form
      action={path}
      onSubmit={submit}
      aria-label={words.label}
      data-pending={pending ? "" : undefined}
      // On a phone, short lists share a row with the sort and the price takes a row of its own, so
      // the products start on the first screen.
      className="grid grid-cols-2 items-end gap-x-2 gap-y-6 md:flex md:flex-wrap md:gap-x-8"
    >
      {/* A search keeps its terms when the filters change. */}
      {shown.terms && <input type="hidden" name={TERMS} value={shown.terms} />}
      {lists.map((list) => (
        <fieldset key={list.id} className={`min-w-0 ${list.values.length > 2 ? "col-span-2" : ""}`}>
          <legend className="mb-3">{list.label}</legend>
          <div className="flex flex-wrap gap-2">
            {list.values.map((value) => {
              const chosen = isChosen(shown, value.param);
              return (
                <label
                  key={value.param.join("=")}
                  className="cursor-pointer has-disabled:cursor-auto"
                >
                  <input
                    type="checkbox"
                    name={value.param[0]}
                    value={value.param[1]}
                    checked={chosen}
                    // A value that would leave nothing can't be added, but can still be taken off.
                    disabled={!chosen && value.count === 0}
                    onChange={(event) => send(event.currentTarget.form)}
                    className="peer sr-only"
                  />
                  <span className="flex h-12 items-center gap-2 bg-surface px-4 transition-colors peer-checked:bg-ink peer-checked:text-ground peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-enabled:hover:bg-stone peer-checked:hover:bg-ink peer-disabled:text-muted">
                    {value.swatch && (
                      <span
                        aria-hidden="true"
                        className="size-4"
                        style={{ backgroundColor: value.swatch }}
                      />
                    )}
                    {value.label}
                    <span className="tabular-nums opacity-70">{value.count}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {price && (
        <fieldset className="order-last col-span-2 min-w-0 md:order-none">
          <legend className="mb-3">{price.label}</legend>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 md:flex">
            <PriceField
              label={words.from}
              name="filter.v.price.gte"
              value={draft.min}
              placeholder="0"
              currency={currency}
              onChange={(min) => setDraft({ ...draft, min })}
            />
            <PriceField
              label={words.to}
              name="filter.v.price.lte"
              value={draft.max}
              placeholder={price.ceiling === undefined ? "" : String(Math.ceil(price.ceiling))}
              currency={currency}
              onChange={(max) => setDraft({ ...draft, max })}
            />
            <button
              type="submit"
              className="h-12 bg-ink px-5 font-medium text-ground transition-colors hover:bg-accent hover:text-accent-ink active:scale-[0.98]"
            >
              {words.apply}
            </button>
          </div>
        </fieldset>
      )}

      <label className="min-w-0 md:ml-auto">
        <span className="mb-3 block">{words.sortBy}</span>
        <span className="relative grid">
          <select
            name="sort_by"
            value={shown.sortBy}
            onChange={(event) => send(event.currentTarget.form)}
            className="flat-select peer col-start-1 row-start-1 h-12 w-full rounded-none bg-surface pr-11 pl-4 transition-colors hover:bg-stone"
          >
            {sorts.map((sort) => (
              <option key={sort} value={sort}>
                {words.sorts[sort]}
              </option>
            ))}
          </select>
          {/*
            A select with a list of our own is only as wide as its chosen label. Hidden copies of every
            label keep it as wide as the longest, as a native one is, so it doesn't jump between sorts.
          */}
          {sorts.map((sort) => (
            <span
              key={sort}
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 h-0 overflow-hidden pr-11 pl-4"
            >
              {words.sorts[sort]}
            </span>
          ))}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 transition-transform peer-open:rotate-180 motion-reduce:transition-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m3 6 5 5 5-5" />
          </svg>
        </span>
      </label>
    </form>
  );
}

interface PriceFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  currency: string;
  onChange: (value: string) => void;
}

/** One end of the price range. Enter sends the form, as in any text field. */
function PriceField({ label, name, value, placeholder, currency, onChange }: PriceFieldProps) {
  return (
    <label className="flex h-12 min-w-0 cursor-text items-center gap-2 bg-surface px-3 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:px-4">
      {/* Side by side, two fields read as a range, so a phone keeps the words for screen readers. */}
      <span className="sr-only text-muted md:not-sr-only">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="w-full min-w-0 bg-transparent tabular-nums md:w-[5ch] [appearance:textfield] placeholder:text-muted focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span>{currency}</span>
    </label>
  );
}

function priceDraft({ price }: Browse) {
  return { min: price.min?.toString() ?? "", max: price.max?.toString() ?? "" };
}
