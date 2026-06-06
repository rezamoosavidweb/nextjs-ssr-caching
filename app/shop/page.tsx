import { Suspense } from "react";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { getCachedProducts } from "@/lib/products-cache";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { parseFilters, productsQueryKey } from "./filters";
import { PAGE_SIZE } from "./fetch-products";
import { ProductExplorer } from "./ProductExplorer";

/**
 * The "real" product list: search, sort and filters live entirely in the URL,
 * the list is virtualized (only visible rows are in the DOM) and React Query
 * hydrates the first page from the server, so a refresh re-uses that data
 * instead of refetching.
 *
 * The data fetch (uncached, request-time) is inside <Suspense>, so the shell
 * (header + intro) renders instantly while the first page streams in.
 */
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <VariantHeader active="shop" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Shop — live search, sort &amp; filters (URL-driven)">
          Everything here is bound to the URL: search, sort, price and rating
          filters. The infinite list is <strong>virtualized</strong> (only the
          rows you can see exist in the DOM) and React Query{" "}
          <strong>hydrates the first page from the server</strong>, so a refresh
          doesn’t refetch. Editing products via the API and revalidating shows
          up here on the next fetch.
        </SectionIntro>

        <Suspense fallback={<ShopFallback />}>
          <ShopData searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function ShopData({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();

  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") sp.set(key, value);
  }
  const filters = parseFilters(sp);

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: productsQueryKey(filters),
    queryFn: () =>
      getCachedProducts({
        q: filters.q || undefined,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        inStock: filters.inStockOnly ? true : undefined,
        cursor: 0,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductExplorer />
    </HydrationBoundary>
  );
}

function ShopFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      <div className="h-[70vh] animate-pulse rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}
