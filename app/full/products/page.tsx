import { cacheLife, cacheTag } from "next/cache";
import { loadProductsPage } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductsListSection } from "@/app/_components/ProductsListSection";

/**
 * STEP 4 — Full-route HTML cache (ISR, Redis).
 *
 * This page has NO `connection()` and no dynamic data, so the ENTIRE route is
 * cacheable: Next prerenders it and stores the whole HTML + RSC payload in the
 * full-route cache handler (Redis). Unlike `/cache` and `/remote` — which cache
 * only the *data* and still render the page per request — here the rendered
 * response itself is served from cache, so Next emits
 * `x-nextjs-cache: HIT` and there is no per-request server work at all.
 *
 * The data is loaded directly (not over HTTP) so the page can be prerendered at
 * build time, when no HTTP server is listening.
 */
async function getFullProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag("products-list");
  return loadProductsPage(0, 20);
}

export default async function Page() {
  const result = await getFullProducts();

  return (
    <>
      <VariantHeader active="full" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 4 — Full-route HTML cache (ISR · Redis)">
          The previous steps cached the <em>data</em>; the page still rendered on
          every request. Here the <strong>whole HTML response</strong> is cached
          in Redis. The response carries a real{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
            x-nextjs-cache: HIT
          </code>{" "}
          header and is served with essentially zero server render time — check
          the Network panel’s response headers.
        </SectionIntro>

        <ProductsListSection
          result={result}
          mode="full"
          basePath="/full"
          servedMs={result.meta.upstreamMs}
        />
      </main>
    </>
  );
}
