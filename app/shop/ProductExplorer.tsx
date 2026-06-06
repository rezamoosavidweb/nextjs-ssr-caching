"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  filtersToSearchParams,
  parseFilters,
  productsQueryKey,
  SORT_OPTIONS,
  type Filters,
} from "./filters";
import { fetchProductsPage, PAGE_SIZE } from "./fetch-products";
import type { ProductSort } from "@/lib/db";

const ROW_HEIGHT = 104;

export function ProductExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the single source of truth for filters.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (next: Filters) => {
      const qs = filtersToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // Debounce the free-text search so we don't push a URL entry per keystroke.
  const [searchText, setSearchText] = useState(filters.q);
  useEffect(() => setSearchText(filters.q), [filters.q]);
  useEffect(() => {
    if (searchText === filters.q) return;
    const t = setTimeout(() => updateFilters({ ...filters, q: searchText }), 300);
    return () => clearTimeout(t);
  }, [searchText, filters, updateFilters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
  } = useInfiniteQuery({
    queryKey: productsQueryKey(filters),
    queryFn: ({ pageParam }) => fetchProductsPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowCount = hasNextPage ? items.length + 1 : items.length;
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  });

  // Infinite scroll: when the loader row scrolls into view, fetch the next page.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchText={searchText}
        onSearch={setSearchText}
        filters={filters}
        onChange={updateFilters}
      />

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          <strong className="text-zinc-800">{total.toLocaleString()}</strong>{" "}
          products
          {filters.q ? (
            <>
              {" "}
              for “<span className="text-zinc-800">{filters.q}</span>”
            </>
          ) : null}
        </span>
        <span className="font-mono text-xs">
          {isFetching ? "loading…" : `${items.length} rendered`}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="h-[70vh] overflow-auto rounded-2xl border border-zinc-200 bg-white"
      >
        {isPending ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No products match these filters.
          </div>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          >
            {virtualItems.map((row) => {
              const isLoaderRow = row.index >= items.length;
              const product = items[row.index];
              return (
                <div
                  key={row.key}
                  data-index={row.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${row.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <div className="flex h-[104px] items-center justify-center text-sm text-zinc-400">
                      {hasNextPage ? "Loading more…" : "End of results"}
                    </div>
                  ) : (
                    <ProductRow product={product} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBar({
  searchText,
  onSearch,
  filters,
  onChange,
}: {
  searchText: string;
  onSearch: (v: string) => void;
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <label className="flex min-w-56 flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Search</span>
        <input
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search products…"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Sort</span>
        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as ProductSort })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex w-24 flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Min $</span>
        <input
          type="number"
          inputMode="numeric"
          value={filters.minPrice ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              minPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex w-24 flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Max $</span>
        <input
          type="number"
          inputMode="numeric"
          value={filters.maxPrice ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              maxPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Min rating</span>
        <select
          value={filters.minRating ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              minRating: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        >
          <option value="">Any</option>
          <option value="3">3★ &amp; up</option>
          <option value="4">4★ &amp; up</option>
          <option value="4.5">4.5★ &amp; up</option>
        </select>
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) =>
            onChange({ ...filters, inStockOnly: e.target.checked })
          }
        />
        In stock
      </label>
    </div>
  );
}

function ProductRow({
  product,
}: {
  product: {
    id: number;
    name: string;
    brand: string;
    category: string;
    price: number;
    oldPrice: number;
    rating: number;
    reviewCount: number;
    thumbnail: string;
    inStock: boolean;
  };
}) {
  return (
    <Link
      href={`/full/products/${product.id}`}
      className="flex h-[104px] items-center gap-4 border-b border-zinc-100 px-4 hover:bg-zinc-50"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          {product.brand} · {product.category}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-800">
          {product.name}
        </span>
        <span className="text-xs text-amber-500">
          ★ <span className="text-zinc-600">{product.rating.toFixed(1)}</span>{" "}
          <span className="text-zinc-400">({product.reviewCount})</span>
          {!product.inStock && (
            <span className="ml-2 text-zinc-400">· out of stock</span>
          )}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-base font-bold text-zinc-900">
          ${product.price}
        </span>
        {product.oldPrice > product.price && (
          <span className="text-xs text-zinc-400 line-through">
            ${product.oldPrice}
          </span>
        )}
      </div>
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex h-[104px] items-center gap-4 border-b border-zinc-100 px-4"
        >
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-zinc-200" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
