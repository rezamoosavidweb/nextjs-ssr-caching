import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { loadProductDetail } from "@/lib/backend";
import { VariantHeader } from "@/app/_components/VariantHeader";
import { SectionIntro } from "@/app/_components/SectionIntro";
import { ProductDetailSection } from "@/app/_components/ProductDetailSection";

/**
 * STEP 4 — Full-route HTML cache for a dynamic route (ISR · Redis).
 *
 * `generateStaticParams` prerenders a few popular products at build time; under
 * Cache Components any other id is generated on first request and then cached
 * (on-demand ISR is the default). Either way the rendered HTML lands in the
 * full-route cache (Redis) and later visits are served with
 * `x-nextjs-cache: HIT`.
 */
export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

async function getFullProduct(id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag(`product-${id}`);
  return loadProductDetail(id);
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getFullProduct(Number(id));
  if (!result) notFound();

  return (
    <>
      <VariantHeader active="full" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <SectionIntro title="Step 4 — Detail page via full-route HTML cache (ISR · Redis)">
          The first visit to a product renders and caches the whole HTML in
          Redis; every later visit — on any instance — is served from that cache
          with <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">x-nextjs-cache: HIT</code>.
        </SectionIntro>

        <ProductDetailSection
          result={result}
          mode="full"
          basePath="/full"
          servedMs={result.meta.upstreamMs}
        />
      </main>
    </>
  );
}
