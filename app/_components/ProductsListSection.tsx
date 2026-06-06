import type { ProductsResult } from "@/lib/backend";
import { RenderBadge, type CacheMode } from "./RenderBadge";
import { ProductCard } from "./ProductCard";

/**
 * Renders the first page of products plus the render badge. Identical for all
 * three variants — only the *data function* that produces `result` differs
 * (uncached vs `use cache` vs `use cache: remote`), which is the whole point.
 */
export function ProductsListSection({
  result,
  mode,
  basePath,
  servedMs,
}: {
  result: ProductsResult;
  mode: CacheMode;
  basePath: string;
  /** Real per-request time spent producing `result` (measured by the caller). */
  servedMs: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      <RenderBadge
        mode={mode}
        servedMs={servedMs}
        generatedAt={result.meta.generatedAt}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {result.items.map((p) => (
          <ProductCard key={p.id} product={p} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
