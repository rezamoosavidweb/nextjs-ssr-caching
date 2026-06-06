import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  // Enables the `use cache` / `use cache: remote` directives.
  cacheComponents: true,

  // better-sqlite3 is a native module — don't bundle it into the server build.
  serverExternalPackages: ["better-sqlite3"],

  // Two independent Redis-backed layers, wired only when REDIS_URL is set:
  //
  //  1. cacheHandlers.remote — the `use cache: remote` DATA cache. The `default`
  //     handler (plain `use cache`) is left as Next's in-memory LRU so the
  //     article can contrast in-memory (`/cache`) vs shared Redis (`/remote`).
  //
  //  2. cacheHandler (singular) — the full-route / ISR cache that stores whole
  //     rendered routes (HTML + RSC). This is what powers the `/full` variant
  //     and what makes Next emit the `x-nextjs-cache: HIT/MISS` response header.
  //
  // NOTE: we intentionally do NOT set `cacheMaxMemorySize: 0` here. That option
  // would force the ISR cache to skip its in-memory copy and always hit Redis
  // (useful for strict multi-instance sharing) — but it ALSO zeroes the
  // in-memory LRU used by plain `use cache`, which would break the in-memory
  // demo in Step 2. The ISR entries still land in Redis without it.
  ...(process.env.REDIS_URL
    ? {
        cacheHandlers: {
          remote: require.resolve("./cache-handlers/redis-cache-handler.cjs"),
        },
        cacheHandler: require.resolve(
          "./cache-handlers/redis-incremental-cache-handler.cjs",
        ),
      }
    : {}),

  images: {
    // The thumbnails are external picsum.photos URLs, so there's nothing to
    // gain from server-side optimization — and serving them unoptimized means
    // the browser fetches them directly. That removes the need for `sharp` and
    // for outbound internet *from the server* just to render images, which makes
    // the Docker/Linux deployment robust.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
