import Link from "next/link";
import { localePath } from "@/i18n/locales";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function NotFound() {
  const [locale, { notFound }] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <section className="grid min-h-[60svh] content-center gap-6 px-gutter">
      <h1 className="text-head font-medium">{notFound.title}</h1>
      <p className="max-w-[40ch]">{notFound.body}</p>
      <Link
        href={localePath(locale, "/#catalogue")}
        className="justify-self-start bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        {notFound.back}
      </Link>
    </section>
  );
}
