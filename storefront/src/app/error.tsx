"use client";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="grid min-h-[60svh] content-center gap-6 px-gutter">
      <h1 className="text-head font-medium">The store didn’t answer</h1>
      <p className="max-w-[40ch]">
        We couldn’t load the catalogue from Shopify just now. Trying again usually helps.
      </p>
      <button
        type="button"
        onClick={retry}
        className="justify-self-start bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        Try again
      </button>
    </section>
  );
}
