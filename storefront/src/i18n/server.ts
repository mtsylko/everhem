import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { dictionaryFor, type Dictionary } from "./dictionaries";
import { hasLocale, type Locale } from "./locales";

/**
 * The page's language, from the URL's first segment. Any Server Component or cached function can
 * read it; inside "use cache" it becomes part of the cache key.
 */
export async function getLocale(): Promise<Locale> {
  const value = await localeParam();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
