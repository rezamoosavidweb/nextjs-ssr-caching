import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { loadProductsPage } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductsListSection } from "@/app/_components/ProductsListSection";
import { BadgeSkeleton, GridSkeleton } from "@/app/_components/Skeletons";

/**
 * STEP 2 — `use cache` (in-memory).
 *
 * The data function is marked `use cache`, so its result — including the
 * backend's `generatedAt` timestamp — is stored in the server's in-memory
 * cache. The first request pays the ~500 ms upstream cost; every request after
 * that is served from memory until the cache is revalidated, so the badge
 * freezes. The cache is per-process: another instance, or a restart, starts
 * cold (that limitation is what Step 3 fixes).
 */
async function getCachedProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag("products-list");
  return loadProductsPage(0, 20);
}

async function CachedList() {
  // `connection()` keeps this page DYNAMIC: the data is cached, but the page is
  // still rendered per request. That is what distinguishes a data cache from the
  // full-route HTML cache in Step 4 (which omits connection() and is therefore
  // prerendered/ISR and served with an `x-nextjs-cache` header).
  await connection();
  const t0 = Date.now();
  const result = await getCachedProducts();
  const servedMs = Date.now() - t0;
  return (
    <ProductsListSection
      result={result}
      mode="cache"
      basePath="/cache"
      servedMs={servedMs}
    />
  );
}

export default function Page() {
  return (
    <>
      <VariantHeader active="cache" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 2 — use cache (in-memory)">
          The same list, but the data function now carries{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
            &quot;use cache&quot;
          </code>
          . The first load is still slow; every refresh after that is instant
          and the badge’s timestamp <strong>stays frozen</strong> — the output
          is reused from memory instead of re-fetching the backend.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <BadgeSkeleton />
              <GridSkeleton />
            </div>
          }
        >
          <CachedList />
        </Suspense>
      </main>
    </>
  );
}
