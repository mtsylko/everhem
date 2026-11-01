/**
 * The colour tokens of a stylesheet's `@theme` block, by name: `--color-ink: #0a0a0a` gives
 * `{ ink: "#0a0a0a" }`. Shared images are drawn outside CSS, and this keeps globals.css their one
 * source of colour.
 */
export function themeColours(css: string): Record<string, string> {
  // The block holds only custom properties, so its first closing brace ends it.
  const theme = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  return Object.fromEntries(
    [...theme.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name!,
      value!.trim(),
    ]),
  );
}
