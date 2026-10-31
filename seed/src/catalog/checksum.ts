import { createHash } from "node:crypto";

/** JSON with sorted object keys, so equal data always gives the same string. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    isPlainObject(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}

export function checksum(value: unknown): string {
  return `sha256:${hashBytes(stableStringify(value))}`;
}

export function hashBytes(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
