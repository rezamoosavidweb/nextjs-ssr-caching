/**
 * Product collection endpoint.
 *
 *   GET  /api/products?cursor=&limit=   — one page of products (slow upstream)
 *   POST /api/products                  — create a product
 *
 * Mutations invalidate the caches they affect with `revalidateTag(..., "max")`,
 * UNLESS the request carries the `x-skip-revalidate` header — handy when the
 * caller knows the change shouldn't bust the cache (e.g. a bulk import that
 * triggers a single revalidation at the end).
 */
import { revalidateTag } from "next/cache";
import { getCachedProducts } from "@/lib/products-cache";
import { createProduct, type ProductInput, type ProductSort } from "@/lib/db";
import { skipRevalidate } from "@/lib/revalidate";

const SORTS: ProductSort[] = [
  "featured",
  "price_asc",
  "price_desc",
  "rating_desc",
  "newest",
];

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get("sort");

  const result = await getCachedProducts({
    cursor: num(searchParams.get("cursor")) ?? 0,
    limit: num(searchParams.get("limit")) ?? 20,
    q: searchParams.get("q") ?? undefined,
    sort: SORTS.includes(sortParam as ProductSort)
      ? (sortParam as ProductSort)
      : undefined,
    minPrice: num(searchParams.get("minPrice")),
    maxPrice: num(searchParams.get("maxPrice")),
    minRating: num(searchParams.get("minRating")),
    inStock:
      searchParams.get("inStock") === "true"
        ? true
        : searchParams.get("inStock") === "false"
          ? false
          : undefined,
  });
  return Response.json(result);
}

export async function POST(request: Request) {
  let body: ProductInput = {};
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    // empty body is fine — a fully random product is created
  }

  const product = createProduct(body ?? {});

  const skipped = skipRevalidate(request);
  if (!skipped) revalidateTag("products-list", "max");

  return Response.json(
    { product, revalidated: skipped ? [] : ["products-list"] },
    { status: 201 },
  );
}
