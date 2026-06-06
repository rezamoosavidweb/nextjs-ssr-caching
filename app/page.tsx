import Link from "next/link";

const CARDS = [
  {
    href: "/ssr/products",
    step: "Step 1",
    title: "SSR · no cache",
    desc: "Fetched fresh on every request. The baseline — slow and repeated.",
    className: "border-rose-200 hover:border-rose-400",
    badge: "bg-rose-100 text-rose-700",
  },
  {
    href: "/cache/products",
    step: "Step 2",
    title: "use cache · in-memory",
    desc: "Cached per server instance. Instant after the first render, but not shared.",
    className: "border-amber-200 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    href: "/remote/products",
    step: "Step 3",
    title: "use cache: remote · Redis",
    desc: "Data shared across every instance via Redis. Survives restarts, revalidated on demand.",
    className: "border-emerald-200 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    href: "/full/products",
    step: "Step 4",
    title: "full-route HTML · Redis",
    desc: "The whole rendered HTML is cached, not just the data. Real x-nextjs-cache: HIT header.",
    className: "border-indigo-200 hover:border-indigo-400",
    badge: "bg-indigo-100 text-indigo-700",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          Next.js Caching Lab
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
          The same product list and detail pages, rendered four ways — from no
          cache to a full-route HTML cache. A fake backend adds a 500&nbsp;ms
          delay to every call so you can <em>see</em> what each strategy buys
          you. Watch the badge on each page: when the timestamp freezes and the
          served time collapses, the cache is working.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${c.className}`}
          >
            <span
              className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}
            >
              {c.step}
            </span>
            <h2 className="text-lg font-bold text-zinc-900">{c.title}</h2>
            <p className="text-sm leading-relaxed text-zinc-600">{c.desc}</p>
            <span className="mt-auto text-sm font-medium text-blue-600">
              Open →
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900">Beyond caching</h2>
        <p className="text-sm leading-relaxed text-zinc-600">
          A realistic product list and an API console built on the same data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Shop — live search, sort &amp; filters →
          </Link>
          <Link
            href="/api-docs"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            API docs (Swagger) →
          </Link>
        </div>
      </div>
    </main>
  );
}
