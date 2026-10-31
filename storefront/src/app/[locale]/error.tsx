"use client";

import { useI18n } from "@/i18n/i18n-context";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const { error } = useI18n().dictionary;
  return (
    <section className="grid min-h-[60svh] content-center gap-6 px-gutter">
      <h1 className="text-head font-medium">{error.title}</h1>
      <p className="max-w-[40ch]">{error.body}</p>
      <button
        type="button"
        onClick={retry}
        className="justify-self-start bg-ink px-6 py-3 font-medium text-ground transition-colors hover:bg-accent active:scale-[0.98]"
      >
        {error.retry}
      </button>
    </section>
  );
}
