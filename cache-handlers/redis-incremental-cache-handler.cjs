/**
 * Redis handler for Next.js' Incremental Cache (the full-route / ISR cache).
 *
 * This is the SECOND, separate cache layer from `cacheHandlers` (which stores
 * `use cache` data). This one stores the whole prerendered route output (HTML +
 * RSC payload) so that ISR pages and on-demand prerenders are shared across
 * instances, and `revalidateTag` / `revalidatePath` invalidate them everywhere.
 *
 * Configure in next.config:
 *   cacheHandler: require.resolve('./cache-handlers/redis-incremental-cache-handler.cjs'),
 *   cacheMaxMemorySize: 0, // disable the per-instance in-memory ISR cache
 *
 * Notes:
 *  - The cached value contains Buffers (rscData), so entries are serialised with
 *    v8.serialize (which preserves Buffers/Maps/Dates) and stored base64 in Redis.
 *  - Tag invalidation uses a tag -> keys index (a Redis set per tag) so
 *    revalidateTag deletes exactly the matching entries across all instances.
 *  - Defensive: a Redis outage degrades to cache misses (fresh renders), never a
 *    crash, via a fail-fast connect + circuit breaker.
 */
const { createClient } = require("redis");
const v8 = require("v8");

const ENTRY_PREFIX = "next:isr:entry:";
const TAGKEYS_PREFIX = "next:isr:tagkeys:";
const CONNECT_TIMEOUT_MS = 2000;
const CIRCUIT_COOLDOWN_MS = 10000;
// Safety TTL so never-revalidated entries can't grow unbounded; fresh renders
// overwrite entries well before this. Tunable.
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

let client;
let connectPromise;
let circuitOpenUntil = 0;
let loggedError = false;

async function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (client && client.isReady) return client;
  if (Date.now() < circuitOpenUntil) return null;

  if (!connectPromise) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: CONNECT_TIMEOUT_MS, reconnectStrategy: false },
    });
    client.on("error", (err) => {
      if (!loggedError) {
        console.error("[redis-isr] client error:", err?.message ?? err);
        loggedError = true;
      }
    });
    connectPromise = client
      .connect()
      .then(() => {
        loggedError = false;
        return true;
      })
      .catch((err) => {
        console.error("[redis-isr] connect failed:", err?.message ?? err);
        circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
        connectPromise = null;
        try {
          client?.destroy?.();
        } catch {
          // ignore
        }
        client = undefined;
        return false;
      });
  }
  await connectPromise;
  return client && client.isReady ? client : null;
}

module.exports = class RedisIncrementalCacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    try {
      const redis = await getClient();
      if (!redis) return null;
      const stored = await redis.get(ENTRY_PREFIX + key);
      if (!stored) return null;
      return v8.deserialize(Buffer.from(stored, "base64"));
    } catch (err) {
      console.error("[redis-isr] get failed:", err?.message ?? err);
      return null; // treat as a cache miss
    }
  }

  async set(key, data, ctx) {
    try {
      const redis = await getClient();
      if (!redis) return;

      if (process.env.DEBUG_ISR_TAGS) {
        const hdrs = data && data.headers ? Object.keys(data.headers) : [];
        console.error(
          "[redis-isr DEBUG] kind=", data && data.kind,
          "ctx.keys=", ctx ? Object.keys(ctx) : null,
          "ctx.tags=", JSON.stringify(ctx && ctx.tags),
          "data.headers=", JSON.stringify(hdrs),
          "x-next-cache-tags=", data && data.headers && data.headers["x-next-cache-tags"],
        );
      }

      // Cache Components puts the route's tags (custom cacheTag values AND the
      // path-based "soft" tags used by revalidatePath) in the
      // `x-next-cache-tags` header on the cached value — NOT in ctx.tags. Index
      // on those so revalidateTag / revalidatePath can invalidate the HTML.
      const headerTags =
        data && data.headers && typeof data.headers["x-next-cache-tags"] === "string"
          ? data.headers["x-next-cache-tags"]
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
      const tags = [
        ...new Set([...headerTags, ...((ctx && ctx.tags) || [])]),
      ];

      const payload = Buffer.from(
        v8.serialize({ value: data, lastModified: Date.now(), tags }),
      ).toString("base64");

      const ttl =
        ctx && typeof ctx.revalidate === "number" && ctx.revalidate > 0
          ? Math.max(ctx.revalidate * 4, 60)
          : DEFAULT_TTL_SECONDS;

      const multi = redis.multi();
      multi.set(ENTRY_PREFIX + key, payload, { EX: Math.ceil(ttl) });
      for (const tag of tags) {
        multi.sAdd(TAGKEYS_PREFIX + tag, key);
        multi.expire(TAGKEYS_PREFIX + tag, Math.ceil(DEFAULT_TTL_SECONDS));
      }
      await multi.exec();
    } catch (err) {
      console.error("[redis-isr] set failed:", err?.message ?? err);
    }
  }

  async revalidateTag(tags) {
    try {
      const redis = await getClient();
      if (!redis) return;

      const tagList = [tags].flat().filter(Boolean);
      for (const tag of tagList) {
        const keys = await redis.sMembers(TAGKEYS_PREFIX + tag);
        const multi = redis.multi();
        for (const key of keys) multi.del(ENTRY_PREFIX + key);
        multi.del(TAGKEYS_PREFIX + tag);
        await multi.exec();
      }
    } catch (err) {
      console.error("[redis-isr] revalidateTag failed:", err?.message ?? err);
    }
  }

  // Per-request in-memory cache reset hook; nothing to reset for Redis.
  resetRequestCache() {}
};
