# Next.js Caching Lab

A hands-on lab for **caching in Next.js 16 (Cache Components)**. The same product
list and detail pages are rendered **four ways** so you can *see* — with real
numbers — exactly what each strategy buys you. A fake backend adds a ~500 ms delay
to every call; each page shows a badge with the real per-request time and a
"generated at" timestamp that **freezes when the cache is working**.

What's inside:

- **Four caching strategies** side by side: SSR, `use cache`, `use cache: remote`
  (Redis), and full-route ISR — each on identical pages so the comparison is fair.
- **Two Redis-backed cache layers**: the data cache (`cacheHandlers`) and the
  full-route HTML/ISR cache (`cacheHandler`).
- A **real product list** (`/shop`): URL-driven search / sort / price & rating
  filters, React Query infinite scroll, and `react-virtual` virtualization.
- **Mutations + cache invalidation**: full CRUD, tag-based `revalidateTag`, a
  "clear everything" endpoint, and an `x-skip-revalidate` opt-out — all documented
  in **Swagger** (`/api-docs`).
- A **SQLite** database seeded from code, and a one-command **Docker + Redis** setup.

| Route | Strategy | What it shows |
| --- | --- | --- |
| `/ssr` | SSR, no cache | Re-fetched every request (the baseline) |
| `/cache` | `use cache` | In-memory data cache, per instance |
| `/remote` | `use cache: remote` | Data cache shared via **Redis** |
| `/full` | full-route ISR | Whole **HTML** cached → real `x-nextjs-cache: HIT` |
| `/shop` | live list | URL-driven search/sort/filters, React Query + virtualization |
| `/api-docs` | Swagger UI | Create / update / delete products, try it out |

> 📖 **Full write-up:** [The Caching Playbook: SSR, `use cache`, Redis and ISR in
> Next.js 16](https://medium.com/@rezamoosavi.kntu/the-caching-playbook-ssr-use-cache-redis-and-isr-in-next-js-16-30ea8d540d13)
> — a complete walkthrough with the measurements and findings.

## Run with Docker (recommended)

```bash
docker compose up --build
# open http://localhost:3000
```

This starts the app **and** a Redis (used by `/remote` and `/full`). No host
dependencies needed.

## Deploy on a server (port 6200)

A self-contained compose file that publishes the app on host port **6200** with
its own internal Redis (it won't touch other stacks on the box):

```bash
git clone git@github.com:rezamoosavidweb/nextjs-ssr-caching.git
cd nextjs-ssr-caching
docker compose -f docker-compose.server.yml up -d --build
# open http://<server-ip>:6200
# update later: git pull && docker compose -f docker-compose.server.yml up -d --build
```

## Run locally

Requires Node 24+ and (optionally) a Redis for the shared-cache variants.

```bash
npm install          # also seeds the SQLite db (postinstall)
npm run build
REDIS_URL=redis://127.0.0.1:6379 npm start
# without REDIS_URL the app falls back to in-memory caches
```

## Data

Products live in a local **SQLite** database (`db/products.db`, gitignored).
It is generated from `lib/seed.mjs` (2,500 products with heavy detail):

```bash
npm run seed         # seed if empty
npm run seed:force   # wipe and reseed
```

## Cache invalidation

Mutations revalidate the relevant tags (`products-list`, `product-<id>`):

```bash
curl -X PATCH localhost:3000/api/products/5 -H 'content-type: application/json' -d '{"price":99}'
# add  -H 'x-skip-revalidate: 1'  to update the DB WITHOUT busting the cache
```
