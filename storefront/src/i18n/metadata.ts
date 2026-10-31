import type { Metadata } from "next";
import { LOCALES, localePath, type Locale } from "./locales";

/**
 * Canonical and hreflang links for a page that exists in every language. x-default is the address
 * without a language, which the proxy sends to the shopper's own.
 */
export function alternates(locale: Locale, path = ""): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((other) => [other, localePath(other, path)])),
      "x-default": path || "/",
    },
  };
}
