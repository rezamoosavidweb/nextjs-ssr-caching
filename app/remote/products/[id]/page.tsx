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
 * STEP 3 — `use cache: remote` detail page (Redis).
 *
 * Each product's heavy payload is stored in Redis under its own key. Any
 * instance that has served this product once lets every other instance serve it
 * instantly, and `revalidateTag("product-<id>")` clears it across all of them.
 */
async function getRemoteProduct(id: number) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products");
  cacheTag(`product-${id}`);
  return loadProductDetail(id);
}

async function RemoteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const t0 = Date.now();
  const result = await getRemoteProduct(Number(id));
  const servedMs = Date.now() - t0;
  if (!result) notFound();
  return (
    <ProductDetailSection
      result={result}
      mode="remote"
      basePath="/remote"
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
      <VariantHeader active="remote" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 3 — Detail page via use cache: remote (Redis)">
          The heavy payload is cached in Redis per product id and shared across
          all instances. The first instance to render a product warms it for
          everyone.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-6">
              <BadgeSkeleton />
              <DetailSkeleton />
            </div>
          }
        >
          <RemoteDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}
