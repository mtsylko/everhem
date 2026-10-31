import type { Locale } from "../locales";
import { en, type Dictionary } from "./en";
import { pl } from "./pl";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, pl };

/** For code that knows its locale, e.g. a Server Action that was given it. */
export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}
