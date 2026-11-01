"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  Suspense,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useI18n } from "@/i18n/i18n-context";
import {
  cleanTerms,
  defaultBrowse,
  MAX_TERMS_LENGTH,
  searchFor,
  TERMS,
} from "@/lib/product/browse";

/** How long typing has to pause before the results follow it. */
const SETTLE_MS = 300;

interface SearchFieldProps {
  /** The search page, without its query. */
  path: string;
}

/**
 * The search box. It is a plain GET form, so it works before JavaScript loads. After that, the
 * results follow as the shopper types, and the form sets `data-pending` so the page can dim the old
 * ones until the new ones arrive.
 */
export function SearchField({ path }: SearchFieldProps) {
  return (
    // The terms are in the query, which only the browser knows on a prerendered page.
    <Suspense fallback={<SearchForm path={path} terms="" />}>
      <SearchFormWithQuery path={path} />
    </Suspense>
  );
}

function SearchFormWithQuery({ path }: SearchFieldProps) {
  const terms = cleanTerms(useSearchParams().get(TERMS) ?? "");
  return <SearchForm path={path} terms={terms} />;
}

function SearchForm({ path, terms }: SearchFieldProps & { terms: string }) {
  const router = useRouter();
  const words = useI18n().dictionary.search;
  const [value, setValue] = useState(terms);
  const [pending, setPending] = useOptimistic(false);
  // The last terms this box asked for, and the last ones the URL had.
  const [sent, setSent] = useState(terms);
  const [seen, setSeen] = useState(terms);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A link can change the terms too: a suggestion, or the header's Search. Terms this box sent
  // itself leave it alone, as the shopper may have typed on since.
  if (seen !== terms) {
    setSeen(terms);
    if (terms !== sent) {
      setSent(terms);
      setValue(terms);
    }
  }

  // A search still waiting to go is dropped when the shopper leaves the page.
  useEffect(() => () => clearTimeout(timer.current), []);

  function search(raw: string) {
    clearTimeout(timer.current);
    const next = cleanTerms(raw);
    if (next === sent) return;
    setSent(next);
    startTransition(() => {
      setPending(true);
      // New terms start without filters, which might leave nothing of them. The history entry is
      // replaced: a pause in typing isn't a page to go back to.
      router.replace(`${path}${searchFor(defaultBrowse("search", next))}`, { scroll: false });
    });
  }

  function change(raw: string) {
    setValue(raw);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(raw), SETTLE_MS);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(value);
  }

  return (
    <form
      action={path}
      role="search"
      onSubmit={submit}
      data-pending={pending ? "" : undefined}
      className="flex gap-2"
    >
      <label className="flex h-14 min-w-0 flex-1 cursor-text items-center gap-3 bg-surface px-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <span className="sr-only">{words.label}</span>
        <input
          type="search"
          name={TERMS}
          value={value}
          onChange={(event) => change(event.currentTarget.value)}
          maxLength={MAX_TERMS_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
          // Someone who opens an empty search page came to type.
          autoFocus={!terms}
          className="w-full min-w-0 bg-transparent text-lead focus-visible:outline-none"
        />
      </label>
      <button
        type="submit"
        className="h-14 bg-ink px-5 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        {words.submit}
      </button>
    </form>
  );
}
