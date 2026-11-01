"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/i18n/i18n-context";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, localePath, type Locale } from "@/i18n/locales";

/** The same page in each language. The chosen one is remembered for the bare domain. */
export function LocaleSwitcher() {
  return (
    // The query (e.g. the chosen colour and size) is only known in the browser.
    <Suspense fallback={<LocaleLinks search="" />}>
      <LocaleLinksWithQuery />
    </Suspense>
  );
}

function LocaleLinksWithQuery() {
  const search = useSearchParams().toString();
  return <LocaleLinks search={search ? `?${search}` : ""} />;
}

function LocaleLinks({ search }: { search: string }) {
  const { locale: current, dictionary } = useI18n();
  // /pl/products/x → /products/x: every path starts with its language.
  const path = usePathname().replace(/^\/[^/]+/, "");

  return (
    <nav aria-label={dictionary.layout.language}>
      <ul className="flex gap-2">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <Link
              href={`${localePath(locale, path)}${search}`}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              onClick={() => remember(locale)}
              className="text-muted uppercase underline-offset-4 hover:text-ink hover:underline aria-[current]:text-ink"
            >
              {/* The name starts with the code on screen ("PL Polski"), so voice control finds it. */}
              {locale}
              <span className="sr-only"> {LOCALE_NAMES[locale]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
