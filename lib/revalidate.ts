/**
 * Cache-invalidation helpers for the mutation endpoints.
 *
 * A request may opt OUT of revalidation by sending the `x-skip-revalidate`
 * header (value `1` / `true` / `yes`). This lets the caller tell the backend
 * "I changed data, but don't bust the cache this time" — for example a bulk
 * import that revalidates once at the end instead of on every write.
 */
export const SKIP_REVALIDATE_HEADER = "x-skip-revalidate";

/**
 * A tag attached to EVERY cached product entry (list, search, and each detail).
 * Revalidating it busts the whole product cache in one call — used by
 * POST /api/revalidate when no specific tag is given.
 */
export const ALL_PRODUCTS_TAG = "products";

export function skipRevalidate(request: Request): boolean {
  const value = request.headers.get(SKIP_REVALIDATE_HEADER)?.toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
