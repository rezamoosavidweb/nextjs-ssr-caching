/**
 * SQLite access layer (better-sqlite3).
 *
 * Opens a single connection to db/products.db and lazily seeds it on first use,
 * so the app works even if `npm run seed` / postinstall never ran. The database
 * file is gitignored; only the schema + generator (lib/seed.mjs) are committed.
 *
 * better-sqlite3 is synchronous; the artificial latency that makes caching
 * observable is added separately in lib/backend.ts.
 */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { seedDatabase, generateProduct, toRow, INSERT_SQL } from "./seed.mjs";
import type { ProductDetail, ProductListItem, ProductsPage } from "./products";

const DB_DIR = join(process.cwd(), "db");
const DB_PATH = join(DB_DIR, "products.db");

type DB = Database.Database;

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __productsDb?: DB };

function getDb(): DB {
  if (globalForDb.__productsDb) return globalForDb.__productsDb;
  mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  seedDatabase(db); // no-op once populated
  globalForDb.__productsDb = db;
  return db;
}

const LIST_COLUMNS =
  "id, name, brand, category, price, oldPrice, currency, rating, reviewCount, thumbnail, shortDescription, inStock";

interface ListRow {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  thumbnail: string;
  shortDescription: string;
  inStock: number;
}

function rowToListItem(r: ListRow): ProductListItem {
  return { ...r, inStock: !!r.inStock };
}

function rowToDetail(r: ListRow & { detail: string }): ProductDetail {
  return { ...rowToListItem(r), ...JSON.parse(r.detail) };
}

export type ProductSort =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "newest";

export interface ProductQuery {
  cursor?: number;
  limit?: number;
  /** Full-text-ish search across name/brand/category/description. */
  q?: string;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
}

const ORDER_BY: Record<ProductSort, string> = {
  featured: "ORDER BY id ASC",
  price_asc: "ORDER BY price ASC, id ASC",
  price_desc: "ORDER BY price DESC, id ASC",
  rating_desc: "ORDER BY rating DESC, reviewCount DESC, id ASC",
  newest: "ORDER BY id DESC",
};

/** Search / sort / filter the catalog. Used by the API and by the variants. */
export function queryProducts(opts: ProductQuery = {}): ProductsPage {
  const db = getDb();
  const start = Math.max(0, opts.cursor ?? 0);
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (opts.q && opts.q.trim()) {
    where.push(
      "(name LIKE @q OR brand LIKE @q OR category LIKE @q OR shortDescription LIKE @q)",
    );
    params.q = `%${opts.q.trim()}%`;
  }
  if (typeof opts.minPrice === "number") {
    where.push("price >= @minPrice");
    params.minPrice = opts.minPrice;
  }
  if (typeof opts.maxPrice === "number") {
    where.push("price <= @maxPrice");
    params.maxPrice = opts.maxPrice;
  }
  if (typeof opts.minRating === "number") {
    where.push("rating >= @minRating");
    params.minRating = opts.minRating;
  }
  if (typeof opts.inStock === "boolean") {
    where.push("inStock = @inStock");
    params.inStock = opts.inStock ? 1 : 0;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = ORDER_BY[opts.sort ?? "featured"];

  const total = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM products ${whereSql}`)
      .get(params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT ${LIST_COLUMNS} FROM products ${whereSql} ${orderSql} LIMIT @limit OFFSET @cursor`,
    )
    .all({ ...params, limit, cursor: start }) as ListRow[];

  const end = start + rows.length;
  return {
    items: rows.map(rowToListItem),
    nextCursor: end < total ? end : null,
    total,
  };
}

/** Simple unfiltered page — used by the cacheable variant pages. */
export function getProductsPage(cursor: number, limit: number): ProductsPage {
  return queryProducts({ cursor, limit });
}

export function getProductDetail(id: number): ProductDetail | null {
  if (!Number.isInteger(id) || id < 1) return null;
  const row = getDb()
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(id) as (ListRow & { detail: string }) | undefined;
  return row ? rowToDetail(row) : null;
}

/** Fields a client may set when creating or updating a product. */
export interface ProductInput {
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  oldPrice?: number;
  shortDescription?: string;
  inStock?: boolean;
}

/** Create a product: a fresh random product, with any provided fields applied. */
export function createProduct(input: ProductInput): ProductDetail {
  const db = getDb();
  const nextId =
    ((db.prepare("SELECT MAX(id) AS m FROM products").get() as { m: number | null })
      .m ?? 0) + 1;

  const generated = generateProduct(nextId, { seed: false });
  const product = { ...generated, ...sanitize(input) };
  db.prepare(INSERT_SQL).run(toRow(product));
  return getProductDetail(nextId)!;
}

/** Update the provided scalar fields of a product. Returns the updated product. */
export function updateProduct(
  id: number,
  patch: ProductInput,
): ProductDetail | null {
  const db = getDb();
  const fields = sanitize(patch);
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return getProductDetail(id);

  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const k of keys) {
    params[k] = k === "inStock" ? (fields[k] ? 1 : 0) : fields[k];
  }
  const info = db
    .prepare(`UPDATE products SET ${set} WHERE id = @id`)
    .run(params);
  return info.changes > 0 ? getProductDetail(id) : null;
}

export function deleteProduct(id: number): boolean {
  const info = getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
  return info.changes > 0;
}

/** Keep only known, well-typed fields from arbitrary input. */
function sanitize(input: ProductInput): ProductInput {
  const out: ProductInput = {};
  if (typeof input.name === "string") out.name = input.name;
  if (typeof input.brand === "string") out.brand = input.brand;
  if (typeof input.category === "string") out.category = input.category;
  if (typeof input.price === "number") out.price = input.price;
  if (typeof input.oldPrice === "number") out.oldPrice = input.oldPrice;
  if (typeof input.shortDescription === "string")
    out.shortDescription = input.shortDescription;
  if (typeof input.inStock === "boolean") out.inStock = input.inStock;
  return out;
}
