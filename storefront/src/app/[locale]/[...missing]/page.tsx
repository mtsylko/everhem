import { notFound } from "next/navigation";

/**
 * The root layout sits under [locale], so Next.js has no layout of ours for an unknown path. This
 * route catches it inside the language, and the 404 page renders in the store's own layout.
 */
export default function Missing() {
  notFound();
}
