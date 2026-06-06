/**
 * Single product endpoint.
 *
 *   GET    /api/products/:id   — heavy product detail (slow upstream)
 *   PATCH  /api/products/:id   — update fields
 *   DELETE /api/products/:id   — delete
 *
 * PATCH and DELETE invalidate both the product's own cache (`product-<id>`) and
 * the list cache (`products-list`), unless the `x-skip-revalidate` header is set.
 */
import { revalidateTag } from "next/cache";
import { loadProductDetail } from "@/lib/backend";
import { updateProduct, deleteProduct, type ProductInput } from "@/lib/db";
import { skipRevalidate } from "@/lib/revalidate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await loadProductDetail(Number(id));
  if (!result) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }
  return Response.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: ProductInput = {};
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    // ignore — empty patch returns the product unchanged
  }

  const product = updateProduct(Number(id), body ?? {});
  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const tags = [`product-${id}`, "products-list"];
  const skipped = skipRevalidate(request);
  if (!skipped) for (const tag of tags) revalidateTag(tag, "max");

  return Response.json({ product, revalidated: skipped ? [] : tags });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ok = deleteProduct(Number(id));
  if (!ok) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const tags = [`product-${id}`, "products-list"];
  const skipped = skipRevalidate(request);
  if (!skipped) for (const tag of tags) revalidateTag(tag, "max");

  return Response.json({ deleted: true, id: Number(id), revalidated: skipped ? [] : tags });
}
