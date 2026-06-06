import { cacheLife, cacheTag } from "next/cache";
import { loadProducts, type ProductsResult } from "./backend";
import type { ProductQuery } from "./db";

/**
 * Search / filter results, cached in Redis and shared across instances.
 *
 * The cache key is the (serialized) query, so each unique combination of
 * search text / sort / price / rating / cursor gets its own entry. After the
 * first view, identical queries are served from cache instead of hitting the
 * DB + the fake 500 ms upstream.
 *
 * Tradeoff (per Next's guidance): free-text search and arbitrary price ranges
 * are high-cardinality, so one-off searches won't hit the cache and create
 * short-lived entries. `cacheLife("minutes")` keeps that bounded.
 *
 * It is tagged `products-list` — the SAME tag the create/update/delete
 * endpoints revalidate — so any product mutation also invalidates every cached
 * search result, keeping the list consistent.
 */
export async function getCachedProducts(
  opts: ProductQuery,
): Promise<ProductsResult> {
  "use cache: remote";
  cacheTag("products"); // global tag → POST /api/revalidate (no body) busts everything
  cacheTag("products-list");
  cacheLife("minutes");
  return loadProducts(opts);
}
