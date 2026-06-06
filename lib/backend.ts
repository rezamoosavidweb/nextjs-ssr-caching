/**
 * The "backend": loads product data and adds an artificial upstream delay so the
 * benefit of caching is visible. Reads the static `db/` via `lib/products`.
 *
 * Both the HTTP API routes (app/api/*) and the server pages call these
 * functions directly — there is no real network hop, but the `sleep` makes each
 * uncached call cost ~500 ms, exactly like a slow database or microservice.
 */
import { queryProducts, getProductDetail, type ProductQuery } from "@/lib/db";
import type { ProductDetail, ProductListItem } from "@/lib/products";
import { sleep, FAKE_API_LATENCY_MS } from "@/lib/sleep";

export interface Meta {
  /** Timestamp this response was produced — frozen on a cache hit. */
  generatedAt: string;
  /** Upstream processing time in ms (the fake delay). */
  upstreamMs: number;
}

export interface ProductsResult {
  items: ProductListItem[];
  nextCursor: number | null;
  total: number;
  meta: Meta;
}

export interface ProductResult {
  product: ProductDetail;
  meta: Meta;
}

/** Search/sort/filter (used by the API). Adds the artificial upstream delay. */
export async function loadProducts(
  opts: ProductQuery,
): Promise<ProductsResult> {
  const started = Date.now();
  await sleep(FAKE_API_LATENCY_MS);
  const page = queryProducts(opts);
  return {
    ...page,
    meta: {
      generatedAt: new Date().toISOString(),
      upstreamMs: Date.now() - started,
    },
  };
}

/** Simple unfiltered page — used by the cacheable variant pages. */
export function loadProductsPage(
  cursor: number,
  limit: number,
): Promise<ProductsResult> {
  return loadProducts({ cursor, limit });
}

export async function loadProductDetail(
  id: number,
): Promise<ProductResult | null> {
  const started = Date.now();
  await sleep(FAKE_API_LATENCY_MS);
  const product = getProductDetail(id);
  if (!product) return null;
  return {
    product,
    meta: {
      generatedAt: new Date().toISOString(),
      upstreamMs: Date.now() - started,
    },
  };
}
