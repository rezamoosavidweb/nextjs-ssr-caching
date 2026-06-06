/**
 * Manual cache invalidation.
 *
 *   POST /api/revalidate                      -> invalidates EVERYTHING
 *   POST /api/revalidate { "tag": "product-5" }   -> only that tag
 *   POST /api/revalidate { "tags": ["a","b"] }    -> only those tags
 *
 * With no tag in the body it revalidates the global `products` tag, which is
 * attached to every cached product entry (list, search and each detail), so a
 * single empty call clears the whole product cache.
 */
import { revalidateTag } from "next/cache";
import { ALL_PRODUCTS_TAG } from "@/lib/revalidate";

export async function POST(request: Request) {
  let body: { tag?: unknown; tags?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // empty / invalid body => invalidate everything
  }

  const requested = [
    ...(Array.isArray(body.tags) ? body.tags : []),
    ...(body.tag !== undefined ? [body.tag] : []),
  ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);

  const all = requested.length === 0;
  const tags = all ? [ALL_PRODUCTS_TAG] : requested;

  for (const tag of tags) revalidateTag(tag, "max");

  return Response.json({ revalidated: tags, all });
}
