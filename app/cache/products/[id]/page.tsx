import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { loadProductDetail } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductDetailSection } from "@/app/_components/ProductDetailSection";
import { BadgeSkeleton, DetailSkeleton } from "@/app/_components/Skeletons";

/**
 * STEP 2 — `use cache` detail page (in-memory).
 *
 * `id` is an argument of the cached function, so it becomes part of the cache
 * key: every product gets its own in-memory entry. The first view of a product
 * is slow; subsequent views of the SAME product are instant.
 */
async function getCachedProduct(id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag(`product-${id}`);
  return loadProductDetail(id);
}

async function CachedDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const t0 = Date.now();
  const result = await getCachedProduct(Number(id));
  const servedMs = Date.now() - t0;
  if (!result) notFound();
  return (
    <ProductDetailSection
      result={result}
      mode="cache"
      basePath="/cache"
      servedMs={servedMs}
    />
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <VariantHeader active="cache" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 2 — Detail page via use cache (in-memory)">
          The heavy payload is cached per product id. Reload this product: the
          badge freezes. Open a different product and it pays the upstream cost
          once, then freezes too.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-6">
              <BadgeSkeleton />
              <DetailSkeleton />
            </div>
          }
        >
          <CachedDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}
