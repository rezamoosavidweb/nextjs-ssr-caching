import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { loadProductDetail } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductDetailSection } from "@/app/_components/ProductDetailSection";
import { BadgeSkeleton, DetailSkeleton } from "@/app/_components/Skeletons";

/**
 * STEP 1 — Pure SSR detail page, no caching.
 *
 * The heavy product payload (12 images, 36 specs, 60 reviews) is re-fetched and
 * re-rendered on every request. The id comes from the route params; the fetch
 * is uncached and lives inside Suspense so it streams at request time.
 */
async function SsrDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const t0 = Date.now();
  const result = await loadProductDetail(Number(id));
  const servedMs = Date.now() - t0;
  if (!result) notFound();
  return (
    <ProductDetailSection
      result={result}
      mode="ssr"
      basePath="/ssr"
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
      <VariantHeader active="ssr" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 1 — Detail page via SSR (no cache)">
          Every visit pays the full upstream cost again. Refresh to see the
          badge’s timestamp and duration change each time.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-6">
              <BadgeSkeleton />
              <DetailSkeleton />
            </div>
          }
        >
          <SsrDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}
