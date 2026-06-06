/**
 * Seed the local SQLite database.
 *
 *   node scripts/seed.mjs           # seed only if empty (safe to run anytime)
 *   node scripts/seed.mjs --force   # wipe and reseed
 *
 * Wired to `npm run seed` and to `postinstall`, so a fresh checkout has data
 * right after `npm install` without committing the DB to git.
 */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { seedDatabase, TOTAL_PRODUCTS } from "../lib/seed.mjs";

const DB_DIR = join(process.cwd(), "db");
const DB_PATH = join(DB_DIR, "products.db");
const force = process.argv.includes("--force");

mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

if (force) db.exec("DROP TABLE IF EXISTS products");

const { inserted, existing } = seedDatabase(db, TOTAL_PRODUCTS);
db.close();

if (inserted > 0) {
  console.log(`Seeded ${inserted} products into db/products.db`);
} else {
  console.log(`db/products.db already has ${existing} products — nothing to do`);
}
