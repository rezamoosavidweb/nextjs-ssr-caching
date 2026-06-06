/**
 * Swagger UI for the product API. Served as a standalone HTML document (loaded
 * from the swagger-ui-dist CDN) so it needs no extra npm dependencies and never
 * clashes with the app's React tree. It points at /api/openapi and has
 * "Try it out" enabled, so you can create / update / delete products here.
 */
const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Products API · Caching Lab</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          deepLinking: true,
          tryItOutEnabled: true,
          defaultModelsExpandDepth: -1,
          presets: [SwaggerUIBundle.presets.apis],
        });
      };
    </script>
  </body>
</html>`;

export function GET() {
  return new Response(HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
