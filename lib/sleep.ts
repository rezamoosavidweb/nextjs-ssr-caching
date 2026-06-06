/**
 * Simulate the latency of a real upstream API (database, CMS, microservice).
 *
 * Every data function in this demo awaits `sleep(...)` so that the difference
 * between "no cache" and "cached" is obvious in the network panel: an uncached
 * request always pays this cost, a cached one pays it only once.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Default fake upstream latency, in milliseconds. */
export const FAKE_API_LATENCY_MS = 500;
