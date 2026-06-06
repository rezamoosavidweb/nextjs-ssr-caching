/**
 * The visual centerpiece of the article. Every data section renders one of
 * these. For the request-time variants (ssr / cache / remote) it shows the REAL
 * per-request `served in N ms` plus a HIT / MISS / NO-CACHE chip, so the
 * data-cache speed-up is visible.
 *
 * The `full` variant is different: its WHOLE HTML response is cached (full-route
 * ISR), so the page code does not run again on a hit — there is nothing to time
 * on the server. Its proof is the `x-nextjs-cache: HIT` response header and the
 * frozen `generated at` timestamp, not an on-page served time.
 *
 * Note: only the full-route cache makes Next emit `x-nextjs-cache: HIT/MISS`.
 * The data caches (`use cache` / `use cache: remote`) do not — for those the
 * HIT/MISS chip here is inferred from the served time.
 */
export type CacheMode = "ssr" | "cache" | "remote" | "full";

/** A served time under this many ms means the upstream call was skipped. */
const HIT_THRESHOLD_MS = 120;

const MODES: Record<
  CacheMode,
  { label: string; sub: string; className: string; dot: string }
> = {
  ssr: {
    label: "SSR · no cache",
    sub: "fetched fresh on every request",
    className: "border-rose-300 bg-rose-50 text-rose-900",
    dot: "bg-rose-500",
  },
  cache: {
    label: "use cache · in-memory",
    sub: "data cached per server instance",
    className: "border-amber-300 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  remote: {
    label: "use cache: remote · Redis",
    sub: "data shared across all instances",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
  },
  full: {
    label: "full-route ISR · Redis (HTML)",
    sub: "the whole HTML response is cached",
    className: "border-indigo-300 bg-indigo-50 text-indigo-900",
    dot: "bg-indigo-500",
  },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleTimeString("en-US", { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

function StateChip({ mode, servedMs }: { mode: CacheMode; servedMs: number }) {
  if (mode === "full") {
    return (
      <span className="rounded-md bg-indigo-200/80 px-2 py-0.5 text-xs font-bold tracking-wide text-indigo-800">
        HTML CACHED · x-nextjs-cache: HIT
      </span>
    );
  }
  if (mode === "ssr") {
    return (
      <span className="rounded-md bg-rose-200/70 px-2 py-0.5 text-xs font-bold tracking-wide text-rose-800">
        NO CACHE
      </span>
    );
  }
  const hit = servedMs < HIT_THRESHOLD_MS;
  return hit ? (
    <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-xs font-bold tracking-wide text-emerald-800">
      CACHE HIT
    </span>
  ) : (
    <span className="rounded-md bg-orange-200/80 px-2 py-0.5 text-xs font-bold tracking-wide text-orange-800">
      CACHE MISS
    </span>
  );
}

export function RenderBadge({
  mode,
  servedMs,
  generatedAt,
}: {
  mode: CacheMode;
  /** Real per-request fetch time. Meaningless for `full` (page doesn't re-run). */
  servedMs: number;
  generatedAt: string;
}) {
  const m = MODES[mode];
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-5 py-3 text-sm font-medium ${m.className}`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
        <span className="font-semibold">{m.label}</span>
      </span>
      <span className="hidden opacity-70 sm:inline">{m.sub}</span>

      <span className="ml-auto flex items-center gap-4 font-mono text-[13px]">
        <StateChip mode={mode} servedMs={servedMs} />
        {mode !== "full" && (
          <span title="Real time THIS request spent fetching the data (skips upstream on a hit)">
            served in <strong>{servedMs} ms</strong>
          </span>
        )}
        <span
          className="hidden md:inline"
          title="Timestamp the backend baked into the data — frozen on a cache hit"
        >
          generated at <strong>{fmtTime(generatedAt)}</strong>
        </span>
      </span>
    </div>
  );
}
