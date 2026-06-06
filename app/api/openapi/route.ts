import { openapiSpec } from "@/lib/openapi";

/** Serves the OpenAPI spec consumed by Swagger UI at /api-docs. */
export function GET() {
  return Response.json(openapiSpec);
}
