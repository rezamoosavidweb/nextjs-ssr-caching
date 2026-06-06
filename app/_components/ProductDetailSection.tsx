import type { ProductResult } from "@/lib/backend";
import { RenderBadge, type CacheMode } from "./RenderBadge";
import { ProductDetailView } from "./ProductDetailView";

/**
 * Renders one heavy product detail plus the render badge. Shared by all three
 * variants; only the data function that produces `result` differs.
 */
export function ProductDetailSection({
  result,
  mode,
  basePath,
  servedMs,
}: {
  result: ProductResult;
  mode: CacheMode;
  basePath: string;
  /** Real per-request time spent producing `result` (measured by the caller). */
  servedMs: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <RenderBadge
        mode={mode}
        servedMs={servedMs}
        generatedAt={result.meta.generatedAt}
      />
      <ProductDetailView product={result.product} basePath={basePath} />
    </div>
  );
}
