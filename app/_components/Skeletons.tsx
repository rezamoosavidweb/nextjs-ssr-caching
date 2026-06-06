/** Loading placeholders shown inside Suspense while uncached data streams in. */

export function BadgeSkeleton() {
  return (
    <div className="h-12 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
  );
}

export function GridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-200" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-zinc-200" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-zinc-200" />
          <div className="h-10 w-1/3 animate-pulse rounded bg-zinc-200" />
          <div className="h-24 w-full animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
