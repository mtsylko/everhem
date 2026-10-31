import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[60svh] content-center gap-6 px-gutter">
      <h1 className="text-head font-medium">This page isn’t in the catalogue</h1>
      <p className="max-w-[40ch]">
        The link may be old, or the product may have been taken out of the range.
      </p>
      <Link
        href="/#catalogue"
        className="justify-self-start bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        See all basics
      </Link>
    </section>
  );
}
