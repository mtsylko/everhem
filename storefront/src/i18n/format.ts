import type { Locale } from "./locales";

/**
 * A message that depends on a count. English needs one and other; Polish also needs few (2–4,
 * 22–24…) and many (5–21, 25…). Intl.PluralRules picks the form.
 */
export interface Plural {
  one?: string;
  few?: string;
  many?: string;
  other: string;
}

/** Types a dictionary entry as a Plural, so each language can have its own forms. */
export function plural(forms: Plural): Plural {
  return forms;
}

/** Fills {name} placeholders. Messages are plain strings, so they can travel to Client Components. */
export function format(message: string, values: Readonly<Record<string, string | number>>): string {
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}

export function formatPlural(
  locale: Locale,
  forms: Plural,
  count: number,
  values: Readonly<Record<string, string | number>> = {},
): string {
  const form = new Intl.PluralRules(locale).select(count) as keyof Plural;
  return format(forms[form] ?? forms.other, { count, ...values });
}
