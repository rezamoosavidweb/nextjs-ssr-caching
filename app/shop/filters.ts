import type { ProductSort } from "@/lib/db";

/** The list's filter state — the single source of truth is the URL. */
export interface Filters {
  q: string;
  sort: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly: boolean;
}

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "rating_desc", label: "Top rated" },
  { value: "newest", label: "Newest" },
];

const SORT_VALUES = SORT_OPTIONS.map((s) => s.value);

/** Anything with a `.get(name)` — both URLSearchParams and Next's read-only one. */
type ReadableParams = { get(name: string): string | null };

function int(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseFilters(params: ReadableParams): Filters {
  const sort = params.get("sort") as ProductSort | null;
  return {
    q: params.get("q") ?? "",
    sort: sort && SORT_VALUES.includes(sort) ? sort : "featured",
    minPrice: int(params.get("minPrice")),
    maxPrice: int(params.get("maxPrice")),
    minRating: int(params.get("minRating")),
    inStockOnly: params.get("inStock") === "true",
  };
}

/** Serialize filters to URL query params, omitting empty/default values. */
export function filtersToSearchParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sort && f.sort !== "featured") p.set("sort", f.sort);
  if (typeof f.minPrice === "number") p.set("minPrice", String(f.minPrice));
  if (typeof f.maxPrice === "number") p.set("maxPrice", String(f.maxPrice));
  if (typeof f.minRating === "number") p.set("minRating", String(f.minRating));
  if (f.inStockOnly) p.set("inStock", "true");
  return p;
}

/** A stable React Query key for a set of filters. */
export function productsQueryKey(f: Filters) {
  return ["products", filtersToSearchParams(f).toString()] as const;
}
