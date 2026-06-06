import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { loadProductsPage } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductsListSection } from "@/app/_components/ProductsListSection";
import { BadgeSkeleton, GridSkeleton } from "@/app/_components/Skeletons";

/**
 * STEP 3 — `use cache: remote` (Redis).
 *
 * Identical to Step 2 except the directive is `use cache: remote`, which routes
 * the entry to the configured `remote` cache handler — here, Redis (see
 * next.config.ts + cache-handlers/redis-cache-handler.cjs). The entry is now
 * shared across every server instance and survives restarts, and
 * `revalidateTag("products-list")` invalidates it everywhere at once.
 */
async function getRemoteProducts() {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products");
  cacheTag("products-list");
  return loadProductsPage(0, 20);
}

async function RemoteList() {
  // `connection()` keeps the page dynamic (data cache only). Without it the
  // whole route would be prerendered into the full-route HTML cache — that is
  // exactly Step 4 (`/full`).
  await connection();
  const t0 = Date.now();
  const result = await getRemoteProducts();
  const servedMs = Date.now() - t0;
  return (
    <ProductsListSection
      result={result}
      mode="remote"
      basePath="/remote"
      servedMs={servedMs}
    />
  );
}

export default function Page() {
  return (
    <>
      <VariantHeader active="remote" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 3 — use cache: remote (Redis)">
          The directive is now{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
            &quot;use cache: remote&quot;
          </code>
          . The cached output lives in Redis, so it is{" "}
          <strong>shared across every instance</strong> and survives restarts.
          Restart the server and refresh — the badge stays frozen because the
          entry came from Redis, not local memory.
        </SectionIntro>

        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <BadgeSkeleton />
              <GridSkeleton />
            </div>
          }
        >
          <RemoteList />
        </Suspense>
      </main>
    </>
  );
}
