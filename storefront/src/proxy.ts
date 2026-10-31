import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  hasLocale,
  LOCALE_COOKIE,
  localePath,
  negotiateLocale,
} from "./i18n/locales";

/**
 * Every page lives under a language prefix, so each one prerenders once per language. A URL
 * without one is sent to the language the shopper picked before, or else the one their browser asks for.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasLocale(pathname.split("/")[1])) return;

  const picked = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(picked)
    ? picked
    : (negotiateLocale(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);

  const url = request.nextUrl.clone();
  url.pathname = localePath(locale, pathname);
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Skips Next.js internals and files such as /favicon.ico.
  matcher: ["/((?!_next/|.*\\.\\w+$).*)"],
};
