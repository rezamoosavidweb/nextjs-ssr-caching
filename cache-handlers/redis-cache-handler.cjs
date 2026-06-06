/**
 * Redis cache handler for Next.js Cache Components (`use cache` / `use cache: remote`).
 *
 * Implements the `cacheHandlers` interface so cached entries are stored in a
 * shared Redis instead of per-process memory, letting multiple frontend
 * instances share the cache and propagate `revalidateTag` to each other.
 *
 * Configure in next.config (see below) and set REDIS_URL.
 *
 * Design notes:
 *  - Entries are serialised (the value ReadableStream -> base64) into a single
 *    Redis string keyed by the cache key, with a TTL of `expire` seconds so
 *    Redis auto-evicts hard-expired entries.
 *  - Tag invalidation is coordinated across instances: updateTags() writes the
 *    invalidation timestamp to Redis, refreshTags() syncs those timestamps into
 *    a local map before each request, and get()/getExpiration() treat an entry
 *    as stale if any of its tags (or soft tags) was invalidated after it was
 *    written.
 *  - Every operation is defensive: on any Redis error get() returns undefined
 *    (a cache miss) and set()/updateTags() no-op, so a Redis outage degrades to
 *    "no shared cache" instead of crashing the app.
 */
const { createClient } = require("redis");

const ENTRY_PREFIX = "next:cache:";
const TAG_PREFIX = "next:tag:";
const REVALIDATED_TAGS_SET = "next:revalidated-tags";

// Synced from Redis on refreshTags(); used by get()/getExpiration().
const localTagTimestamps = new Map();

const CONNECT_TIMEOUT_MS = 2000;
const CIRCUIT_COOLDOWN_MS = 10000;

let client;
let connectPromise;
let circuitOpenUntil = 0; // skip Redis until this time after a failure
let loggedError = false;

async function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (client && client.isReady) return client;
  // Circuit breaker: after a failed connect, don't retry on every cache call
  // (which would otherwise block every `use cache` access while Redis is down).
  if (Date.now() < circuitOpenUntil) return null;

  if (!connectPromise) {
    client = createClient({
      url: process.env.REDIS_URL,
      // Fail fast instead of retrying forever so a Redis outage degrades to a
      // cache miss rather than hanging the build/request.
      socket: { connectTimeout: CONNECT_TIMEOUT_MS, reconnectStrategy: false },
    });
    client.on("error", (err) => {
      if (!loggedError) {
        console.error("[redis-cache] client error:", err?.message ?? err);
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
        console.error("[redis-cache] connect failed:", err?.message ?? err);
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

async function streamToBase64(stream) {
  const reader = stream.getReader();
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("base64");
}

function base64ToStream(base64) {
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function maxTagTimestamp(tags) {
  let max = 0;
  for (const tag of tags) {
    const ts = localTagTimestamps.get(tag) || 0;
    if (ts > max) max = ts;
  }
  return max;
}

module.exports = {
  async get(cacheKey, softTags) {
    try {
      const redis = await getClient();
      if (!redis) return undefined;

      const stored = await redis.get(ENTRY_PREFIX + cacheKey);
      if (!stored) return undefined;

      const data = JSON.parse(stored);

      // Stale if any of the entry's tags or the route's soft tags were
      // invalidated after this entry was written.
      const invalidatedAt = maxTagTimestamp([
        ...(data.tags || []),
        ...(softTags || []),
      ]);
      if (invalidatedAt > data.timestamp) return undefined;

      return {
        value: base64ToStream(data.value),
        tags: data.tags,
        stale: data.stale,
        timestamp: data.timestamp,
        expire: data.expire,
        revalidate: data.revalidate,
      };
    } catch (err) {
      console.error("[redis-cache] get failed:", err?.message ?? err);
      return undefined; // treat any failure as a cache miss
    }
  },

  async set(cacheKey, pendingEntry) {
    try {
      const entry = await pendingEntry;
      const redis = await getClient();
      if (!redis) return;

      const value = await streamToBase64(entry.value);
      const payload = JSON.stringify({
        value,
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      });

      const ttlSeconds = Math.max(1, Math.ceil(entry.expire));
      await redis.set(ENTRY_PREFIX + cacheKey, payload, { EX: ttlSeconds });
    } catch (err) {
      console.error("[redis-cache] set failed:", err?.message ?? err);
    }
  },

  async refreshTags() {
    try {
      const redis = await getClient();
      if (!redis) return;

      const tags = await redis.sMembers(REVALIDATED_TAGS_SET);
      if (!tags.length) return;

      const values = await redis.mGet(tags.map((tag) => TAG_PREFIX + tag));
      tags.forEach((tag, i) => {
        localTagTimestamps.set(tag, Number(values[i]) || 0);
      });
    } catch (err) {
      console.error("[redis-cache] refreshTags failed:", err?.message ?? err);
    }
  },

  async getExpiration(tags) {
    if (!tags || tags.length === 0) return 0;
    return maxTagTimestamp(tags);
  },

  async updateTags(tags, _durations) {
    const now = Date.now();
    for (const tag of tags) localTagTimestamps.set(tag, now);

    try {
      const redis = await getClient();
      if (!redis) return;

      const multi = redis.multi();
      for (const tag of tags) {
        multi.set(TAG_PREFIX + tag, String(now));
        multi.sAdd(REVALIDATED_TAGS_SET, tag);
      }
      await multi.exec();
    } catch (err) {
      console.error("[redis-cache] updateTags failed:", err?.message ?? err);
    }
  },
};
