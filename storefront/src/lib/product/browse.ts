import type { ProductCollectionSortKeys, ProductFilter } from "../../../generated/storefront.types";

/**
 * How a collection can be sorted, under the `sort_by` values Liquid themes use. Best-selling is left
 * out: a demo store has no sales to rank by.
 */
export const SORTS = {
  manual: { sortKey: "COLLECTION_DEFAULT", reverse: false },
  "created-descending": { sortKey: "CREATED", reverse: true },
  "price-ascending": { sortKey: "PRICE", reverse: false },
  "price-descending": { sortKey: "PRICE", reverse: true },
} as const satisfies Record<string, { sortKey: ProductCollectionSortKeys; reverse: boolean }>;

export type SortBy = keyof typeof SORTS;

export const DEFAULT_SORT: SortBy = "manual";

const SORT_BY = "sort_by";
const AVAILABILITY = "filter.v.availability";
const PRICE_MIN = "filter.v.price.gte";
const PRICE_MAX = "filter.v.price.lte";
/** A hand-made URL can't make the query any longer than a store's 25 filters could. */
const MAX_VALUES = 25;
const MAX_VALUE_LENGTH = 100;

/** Prices a shopper typed, in the store's currency. Either end can be open. */
export interface PriceBounds {
  min?: number;
  max?: number;
}

/**
 * What a shopper narrowed a collection to. It lives in the URL, under the parameter names Liquid
 * themes use (filter.v.availability=1, filter.v.price.gte=100), so a link can be shared and the
 * back button undoes a filter.
 */
export interface Browse {
  /** The chosen values of every filter but price, as URL parameters, in a stable order. */
  values: Array<[string, string]>;
  price: PriceBounds;
  sortBy: SortBy;
}

export const DEFAULT_BROWSE: Browse = { values: [], price: {}, sortBy: DEFAULT_SORT };

/**
 * Reads the browse state from a URL, dropping anything it doesn't know. Each value has a parameter
 * of its own: Liquid also allows `red,blue`, but a comma can be part of a value.
 */
export function readBrowse(params: URLSearchParams): Browse {
  const values: Array<[string, string]> = [];
  for (const [key, raw] of params) {
    const value = raw.trim();
    const known = value.length <= MAX_VALUE_LENGTH && filterFor(key, value);
    if (known && !values.some(([k, v]) => k === key && v === value)) values.push([key, value]);
  }

  // In stock or out of stock is every product, so asking for both is asking for neither.
  const availability = values.filter(([key]) => key === AVAILABILITY);
  const chosen = availability.length > 1 ? values.filter(([key]) => key !== AVAILABILITY) : values;
  // A stable order, so the same choice in another order reads from the same cache entry.
  chosen.sort(([a, x], [b, y]) => compare(a, b) || compare(x, y));

  const sort = params.get(SORT_BY);
  return {
    values: chosen.slice(0, MAX_VALUES),
    price: priceBounds(amount(params.get(PRICE_MIN)), amount(params.get(PRICE_MAX))),
    sortBy: sort && Object.hasOwn(SORTS, sort) ? (sort as SortBy) : DEFAULT_SORT,
  };
}

/** The Storefront API arguments for a browse state. Values of one filter match any of them. */
export function queryFor({ values, price, sortBy }: Browse) {
  const filters = values.flatMap(([key, value]) => filterFor(key, value) ?? []);
  if (price.min !== undefined || price.max !== undefined) filters.push({ price });
  return { filters, ...SORTS[sortBy] };
}

/** The query string for a browse state, without the default sort: "" when nothing is chosen. */
export function searchFor({ values, price, sortBy }: Browse): string {
  const params = new URLSearchParams(values);
  if (price.min !== undefined) params.set(PRICE_MIN, String(price.min));
  if (price.max !== undefined) params.set(PRICE_MAX, String(price.max));
  if (sortBy !== DEFAULT_SORT) params.set(SORT_BY, sortBy);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Whether a browse state leaves products out. Sorting only reorders them. */
export function isNarrowed({ values, price }: Browse): boolean {
  return values.length > 0 || price.min !== undefined || price.max !== undefined;
}

/** Next.js hands a page its query as a record; this turns it back into URL parameters. */
export function toSearchParams(
  query: Readonly<Record<string, string | string[] | undefined>>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of [value ?? []].flat()) params.append(key, item);
  }
  return params;
}

/** A filter as the Storefront API describes it, with how many products each value would leave. */
export interface ShopifyFilter {
  id: string;
  label: string;
  type: string;
  values: ReadonlyArray<{
    label: string;
    count: number;
    /** The value as a ProductFilter, serialized as JSON. */
    input: unknown;
    swatch?: { color?: unknown } | null;
  }>;
}

export interface FacetValue {
  label: string;
  count: number;
  /** The URL parameter that chooses this value. */
  param: [string, string];
  /** A CSS colour, for a value that is one. */
  swatch?: string;
}

export interface ListFacet {
  id: string;
  label: string;
  values: FacetValue[];
}

export interface PriceFacet {
  label: string;
  /** The highest price in the results, as a hint for the upper bound. */
  ceiling?: number;
}

export interface Facets {
  lists: ListFacet[];
  price: PriceFacet | null;
}

/**
 * Turns the filters a store offers into what the filter form shows. The store decides which
 * filters exist (Search & Discovery in the Shopify admin), so a new one shows up without a code
 * change. Values this storefront can't put in a URL are left out.
 */
export function facetsFrom(filters: readonly ShopifyFilter[]): Facets {
  const facets: Facets = { lists: [], price: null };
  for (const filter of filters) {
    if (filter.type === "PRICE_RANGE") {
      const max = parseInput(filter.values[0]?.input)?.price?.max;
      facets.price = { label: filter.label, ...(typeof max === "number" && { ceiling: max }) };
      continue;
    }

    const values = filter.values.flatMap(({ label, count, input, swatch }) => {
      const parsed = parseInput(input);
      // Shopify calls a product out of stock when any one of its variants is, so "out of stock"
      // mostly lists things that can be bought. Nobody browses for what they can't buy anyway.
      if (!parsed || parsed.available === false) return [];
      const param = paramFor(parsed);
      if (!param) return [];
      const colour = typeof swatch?.color === "string" ? swatch.color : undefined;
      return [{ label, count, param, ...(colour && { swatch: colour }) }];
    });
    if (values.length > 0) facets.lists.push({ id: filter.id, label: filter.label, values });
  }
  return facets;
}

/** Whether a browse state has a parameter chosen. */
export function isChosen({ values }: Browse, [key, value]: readonly [string, string]): boolean {
  return values.some(([k, v]) => k === key && v === value);
}

/** The ProductFilter for one URL parameter, or null when the parameter isn't a filter we know. */
function filterFor(key: string, value: string): ProductFilter | null {
  if (!value) return null;
  if (key === AVAILABILITY) {
    return value === "1" ? { available: true } : value === "0" ? { available: false } : null;
  }
  if (key === "filter.p.product_type") return { productType: value };
  if (key === "filter.p.vendor") return { productVendor: value };
  if (key === "filter.p.tag") return { tag: value };

  const option = /^filter\.v\.option\.([^.]+)$/.exec(key);
  if (option) return { variantOption: { name: option[1]!, value } };

  const metafield = /^filter\.([pv])\.m\.([\w-]+)\.([\w-]+)$/.exec(key);
  if (metafield) {
    const [, scope, namespace, metafieldKey] = metafield;
    const filter = { namespace: namespace!, key: metafieldKey!, value };
    return scope === "p" ? { productMetafield: filter } : { variantMetafield: filter };
  }
  return null;
}

/** The URL parameter for one filter value: the reverse of filterFor. */
function paramFor(filter: ProductFilter): [string, string] | null {
  if (typeof filter.available === "boolean") return [AVAILABILITY, filter.available ? "1" : "0"];
  if (filter.productType) return ["filter.p.product_type", filter.productType];
  if (filter.productVendor) return ["filter.p.vendor", filter.productVendor];
  if (filter.tag) return ["filter.p.tag", filter.tag];
  if (filter.variantOption) {
    const { name, value } = filter.variantOption;
    return [`filter.v.option.${name}`, value];
  }
  const metafield = filter.productMetafield ?? filter.variantMetafield;
  if (metafield) {
    const scope = filter.productMetafield ? "p" : "v";
    return [`filter.${scope}.m.${metafield.namespace}.${metafield.key}`, metafield.value];
  }
  // Category and taxonomy filters have no Liquid parameter this storefront reads back.
  return null;
}

/** A filter value's `input`: JSON in a string, as the Storefront API sends it. */
function parseInput(input: unknown): ProductFilter | null {
  try {
    const value: unknown = typeof input === "string" ? JSON.parse(input) : input;
    return typeof value === "object" && value !== null ? (value as ProductFilter) : null;
  } catch {
    return null;
  }
}

function amount(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  // A Polish shopper may type 99,50.
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function priceBounds(min: number | undefined, max: number | undefined): PriceBounds {
  // A range typed the wrong way round still means the prices between the two.
  const [low, high] = min !== undefined && max !== undefined && min > max ? [max, min] : [min, max];
  return {
    ...(low !== undefined && { min: low }),
    ...(high !== undefined && { max: high }),
  };
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
