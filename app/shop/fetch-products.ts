import type { ProductsResult } from "@/lib/backend";
import { filtersToSearchParams, type Filters } from "./filters";

export const PAGE_SIZE = 24;

/** Client-side fetch of one page from the backend API for the given filters. */
export async function fetchProductsPage(
  filters: Filters,
  cursor: number,
): Promise<ProductsResult> {
  const params = filtersToSearchParams(filters);
  params.set("cursor", String(cursor));
  params.set("limit", String(PAGE_SIZE));

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
  return (await res.json()) as ProductsResult;
}
