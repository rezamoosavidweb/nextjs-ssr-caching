import Image from "next/image";
import Link from "next/link";
import type { ProductDetail } from "@/lib/products";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-zinc-300">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

/** Heavy, server-rendered product detail: gallery, specs (36) and reviews (60). */
export function ProductDetailView({
  product,
  basePath,
}: {
  product: ProductDetail;
  basePath: string;
}) {
  return (
    <article className="flex flex-col gap-10">
      {/* Hero: gallery + summary */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100">
            <Image
              src={product.gallery[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {product.gallery.slice(1, 7).map((src, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100"
              >
                <Image
                  src={src}
                  alt={`${product.name} ${i + 2}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {product.brand} · {product.category}
          </span>
          <h1 className="text-3xl font-bold leading-tight text-zinc-900">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <Stars rating={product.rating} />
            <span className="font-medium text-zinc-700">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-zinc-400">· {product.reviewCount} reviews</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-zinc-900">
              ${product.price}
            </span>
            {product.oldPrice > product.price && (
              <span className="text-lg text-zinc-400 line-through">
                ${product.oldPrice}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-zinc-600">
            {product.shortDescription}
          </p>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-4 text-sm">
            <div>
              <dt className="text-zinc-400">SKU</dt>
              <dd className="font-mono text-zinc-800">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Warranty</dt>
              <dd className="text-zinc-800">{product.warranty}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Weight</dt>
              <dd className="text-zinc-800">{product.weightKg} kg</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Dimensions</dt>
              <dd className="text-zinc-800">{product.dimensions}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-1">
            {product.features.slice(0, 8).map((f, i) => (
              <span
                key={i}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-zinc-900">Description</h2>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-600">
          {product.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Specs */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-zinc-900">Specifications</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <tbody>
              {product.specs.map((s, i) => (
                <tr
                  key={i}
                  className={i % 2 ? "bg-zinc-50" : "bg-white"}
                >
                  <td className="w-40 px-4 py-2 text-zinc-400">{s.group}</td>
                  <td className="px-4 py-2 font-medium text-zinc-700">
                    {s.label}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviews */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-zinc-900">
          Reviews ({product.reviews.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {product.reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={r.avatar}
                  alt={r.author}
                  width={36}
                  height={36}
                  className="rounded-full bg-zinc-100"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-800">
                    {r.author}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="ml-auto text-xs">
                  <Stars rating={r.rating} />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-800">{r.title}</h4>
              <p className="text-sm leading-relaxed text-zinc-600">{r.body}</p>
              <span className="text-xs text-zinc-400">
                {r.helpfulCount} found this helpful
              </span>
            </div>
          ))}
        </div>
      </section>

      <div>
        <Link
          href={`${basePath}/products`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to products
        </Link>
      </div>
    </article>
  );
}
