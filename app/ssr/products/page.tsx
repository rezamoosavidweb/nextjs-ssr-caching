import { Suspense } from "react";
import { connection } from "next/server";
import { loadProductsPage } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductsListSection } from "@/app/_components/ProductsListSection";
import { BadgeSkeleton, GridSkeleton } from "@/app/_components/Skeletons";

/**
 * STEP 1 — Pure SSR, no caching.
 *
 * `loadProductsPage` has no `use cache` directive, so it runs on EVERY request.
 * `connection()` marks this as request-time work so Next does NOT prerender it
 * into the static shell at build (the data is local, so it otherwise would);
 * the Suspense boundary lets Next stream the shell immediately and the grid in
 * after the upstream responds (~500 ms) — every single refresh.
 */
async function SsrList() {
  await connection();
  const t0 = Date.now();
  const result = await loadProductsPage(0, 20);
  const servedMs = Date.now() - t0;
  return (
    <ProductsListSection
      result={result}
      mode="ssr"
      basePath="/ssr"
      servedMs={servedMs}
    />
  );
}

export default function Page() {
  return (
    <>
      <VariantHeader active="ssr" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 1 — Server-Side Rendering (no cache)">
          The product list is fetched from the backend on the server for every
          request. Refresh the page a few times: the badge’s{" "}
          <strong>generated-at timestamp changes every time</strong>{" "}
          and the grid only appears after the ~500&nbsp;ms upstream delay.
          Nothing is reused.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <BadgeSkeleton />
              <GridSkeleton />
            </div>
          }
        >
          <SsrList />
        </Suspense>
      </main>
    </>
  );
}
