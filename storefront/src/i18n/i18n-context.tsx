"use client";

import { createContext, use, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries";
import type { Locale } from "./locales";

interface I18nValue {
  locale: Locale;
  dictionary: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Hands the page's language and words to Client Components, which can't read root params. */
export function I18nProvider({ children, ...value }: I18nValue & { children: ReactNode }) {
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
