/**
 * Hand-written OpenAPI 3.0 spec for the product API, served at /api/openapi and
 * rendered by Swagger UI at /api-docs. Kept in one place so the docs and the
 * "try it out" console always match the real routes.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Caching Lab — Products API",
    version: "1.0.0",
    description:
      "Manage the product catalog. Mutations revalidate the relevant caches " +
      "(`products-list`, `product-<id>`) unless the `x-skip-revalidate` header is set.",
  },
  servers: [{ url: "/", description: "This server" }],
  tags: [{ name: "Products" }, { name: "Cache" }],
  components: {
    parameters: {
      SkipRevalidate: {
        name: "x-skip-revalidate",
        in: "header",
        required: false,
        description:
          "Set to `1` / `true` / `yes` to tell the backend NOT to invalidate caches for this write.",
        schema: { type: "string", example: "1" },
      },
      Id: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer", minimum: 1 },
        example: 5,
      },
    },
    schemas: {
      ProductInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Aurora Headphones" },
          brand: { type: "string", example: "Acme" },
          category: { type: "string", example: "Electronics" },
          price: { type: "integer", example: 199 },
          oldPrice: { type: "integer", example: 249 },
          shortDescription: { type: "string" },
          inStock: { type: "boolean", example: true },
        },
      },
      Meta: {
        type: "object",
        properties: {
          generatedAt: { type: "string", format: "date-time" },
          upstreamMs: { type: "integer", example: 503 },
        },
      },
      ProductListItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          brand: { type: "string" },
          category: { type: "string" },
          price: { type: "integer" },
          oldPrice: { type: "integer" },
          currency: { type: "string" },
          rating: { type: "number" },
          reviewCount: { type: "integer" },
          thumbnail: { type: "string" },
          shortDescription: { type: "string" },
          inStock: { type: "boolean" },
        },
      },
      ProductsPage: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductListItem" },
          },
          nextCursor: { type: "integer", nullable: true },
          total: { type: "integer" },
          meta: { $ref: "#/components/schemas/Meta" },
        },
      },
    },
  },
  paths: {
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List / search / filter products",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
          { name: "q", in: "query", description: "Search text", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["featured", "price_asc", "price_desc", "rating_desc", "newest"],
            },
          },
          { name: "minPrice", in: "query", schema: { type: "integer" } },
          { name: "maxPrice", in: "query", schema: { type: "integer" } },
          { name: "minRating", in: "query", schema: { type: "number" } },
          { name: "inStock", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          "200": {
            description: "A page of products",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductsPage" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product",
        parameters: [{ $ref: "#/components/parameters/SkipRevalidate" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          "201": { description: "Created (revalidates `products-list`)" },
        },
      },
    },
    "/api/revalidate": {
      post: {
        tags: ["Cache"],
        summary: "Invalidate caches (all, or specific tags)",
        description:
          "With an empty body, invalidates EVERY cached product entry " +
          "(global `products` tag). With `tag` or `tags`, invalidates only those.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tag: { type: "string", example: "product-5" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    example: ["products-list", "product-5"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tags that were revalidated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    revalidated: { type: "array", items: { type: "string" } },
                    all: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get one product (heavy detail)",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: { "200": { description: "Product detail" }, "404": { description: "Not found" } },
      },
      patch: {
        tags: ["Products"],
        summary: "Update a product",
        parameters: [
          { $ref: "#/components/parameters/Id" },
          { $ref: "#/components/parameters/SkipRevalidate" },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          "200": { description: "Updated (revalidates `product-<id>` + `products-list`)" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product",
        parameters: [
          { $ref: "#/components/parameters/Id" },
          { $ref: "#/components/parameters/SkipRevalidate" },
        ],
        responses: {
          "200": { description: "Deleted (revalidates `product-<id>` + `products-list`)" },
          "404": { description: "Not found" },
        },
      },
    },
  },
} as const;
