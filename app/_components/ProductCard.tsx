import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/lib/products";

/** A single product card. `basePath` is the variant root, e.g. "/ssr". */
export function ProductCard({
  product,
  basePath,
}: {
  product: ProductListItem;
  basePath: string;
}) {
  const discount =
    product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <Link
      href={`${basePath}/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            −{discount}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {product.brand}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
          <span aria-hidden>★</span>
          <span className="font-medium text-zinc-700">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-zinc-400">({product.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold text-zinc-900">
            ${product.price}
          </span>
          {discount > 0 && (
            <span className="text-xs text-zinc-400 line-through">
              ${product.oldPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
