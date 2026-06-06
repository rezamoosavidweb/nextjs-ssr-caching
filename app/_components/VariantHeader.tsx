import Link from "next/link";
import type { CacheMode } from "./RenderBadge";

export type ActiveTab = CacheMode | "shop";

const TABS: { href: string; label: string; mode: CacheMode }[] = [
  { href: "/ssr/products", label: "1 · SSR", mode: "ssr" },
  { href: "/cache/products", label: "2 · use cache", mode: "cache" },
  { href: "/remote/products", label: "3 · remote", mode: "remote" },
  { href: "/full/products", label: "4 · full-route HTML", mode: "full" },
];

const ACTIVE: Record<CacheMode, string> = {
  ssr: "bg-rose-600 text-white",
  cache: "bg-amber-600 text-white",
  remote: "bg-emerald-600 text-white",
  full: "bg-indigo-600 text-white",
};

/** Sticky top bar shared by every page, with quick links between variants. */
export function VariantHeader({ active }: { active: ActiveTab }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
        <Link href="/" className="text-sm font-bold text-zinc-900">
          Next.js Caching Lab
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 sm:ml-4">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                t.mode === active
                  ? ACTIVE[t.mode]
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-zinc-200" />
          <Link
            href="/shop"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active === "shop"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Shop (live)
          </Link>
          <Link
            href="/api-docs"
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200"
          >
            API
          </Link>
        </nav>
      </div>
    </header>
  );
}
