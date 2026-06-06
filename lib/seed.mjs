/**
 * Shared schema + data generation for the SQLite product database.
 *
 * Plain ESM so it can be used by BOTH:
 *   - scripts/seed.mjs        (run by `npm run seed` / postinstall, via node)
 *   - lib/db.ts               (the app, which lazily seeds on first run)
 *
 * Heavy detail fields are stored as a JSON string in the `detail` column; the
 * list/card fields are real columns so list queries stay cheap.
 */
import { faker } from "@faker-js/faker";

export const TOTAL_PRODUCTS = 2500;

function img(seed, w, h) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/**
 * Build one full product (deterministic when `seed` is true). Returns the list
 * fields flat plus a nested `detail` object for the heavy fields.
 */
export function generateProduct(id, { seed = true } = {}) {
  if (seed) faker.seed(id);

  const price = faker.number.int({ min: 5, max: 2500 });
  const hasDiscount = faker.datatype.boolean({ probability: 0.6 });

  return {
    id,
    name: faker.commerce.productName(),
    brand: faker.company.name(),
    category: faker.commerce.department(),
    price,
    oldPrice: hasDiscount ? price + faker.number.int({ min: 5, max: 600 }) : price,
    currency: "USD",
    rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
    reviewCount: faker.number.int({ min: 0, max: 4200 }),
    thumbnail: img(`product-${id}`, 400, 300),
    shortDescription: faker.commerce.productDescription(),
    inStock: faker.datatype.boolean({ probability: 0.85 }),
    detail: {
      description: Array.from({ length: 10 }, () =>
        faker.lorem.paragraph({ min: 4, max: 8 }),
      ),
      gallery: Array.from({ length: 12 }, (_, i) =>
        img(`product-${id}-${i}`, 800, 600),
      ),
      features: Array.from(
        { length: 14 },
        () => faker.commerce.productAdjective() + " " + faker.commerce.product(),
      ),
      specs: ["General", "Display", "Performance", "Connectivity", "Physical", "Box Contents"].flatMap(
        (group) =>
          Array.from({ length: 6 }, () => ({
            group,
            label: faker.commerce.productMaterial(),
            value:
              faker.commerce.productAdjective() +
              " " +
              faker.number.int({ min: 1, max: 9999 }),
          })),
      ),
      reviews: Array.from({ length: 60 }, (_, i) => ({
        id: `${id}-r${i}`,
        author: faker.person.fullName(),
        avatar: img(`avatar-${id}-${i}`, 80, 80),
        rating: faker.number.int({ min: 1, max: 5 }),
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        body: faker.lorem.paragraph({ min: 2, max: 5 }),
        date: faker.date.past({ years: 2 }).toISOString(),
        helpfulCount: faker.number.int({ min: 0, max: 340 }),
      })),
      relatedIds: Array.from({ length: 8 }, () =>
        faker.number.int({ min: 1, max: TOTAL_PRODUCTS }),
      ),
      sku: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      warranty: `${faker.number.int({ min: 1, max: 5 })} year limited warranty`,
      weightKg: faker.number.float({ min: 0.1, max: 25, fractionDigits: 2 }),
      dimensions: `${faker.number.int({ min: 5, max: 120 })} × ${faker.number.int({ min: 5, max: 120 })} × ${faker.number.int({ min: 1, max: 40 })} cm`,
    },
  };
}

export function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY,
      name             TEXT    NOT NULL,
      brand            TEXT    NOT NULL,
      category         TEXT    NOT NULL,
      price            INTEGER NOT NULL,
      oldPrice         INTEGER NOT NULL,
      currency         TEXT    NOT NULL,
      rating           REAL    NOT NULL,
      reviewCount      INTEGER NOT NULL,
      thumbnail        TEXT    NOT NULL,
      shortDescription TEXT    NOT NULL,
      inStock          INTEGER NOT NULL,
      detail           TEXT    NOT NULL
    );
  `);
}

/** Map a generated product to a DB row (booleans -> 0/1, detail -> JSON). */
export function toRow(p) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice,
    currency: p.currency,
    rating: p.rating,
    reviewCount: p.reviewCount,
    thumbnail: p.thumbnail,
    shortDescription: p.shortDescription,
    inStock: p.inStock ? 1 : 0,
    detail: JSON.stringify(p.detail),
  };
}

const INSERT_SQL = `
  INSERT OR IGNORE INTO products
    (id, name, brand, category, price, oldPrice, currency, rating, reviewCount,
     thumbnail, shortDescription, inStock, detail)
  VALUES
    (@id, @name, @brand, @category, @price, @oldPrice, @currency, @rating, @reviewCount,
     @thumbnail, @shortDescription, @inStock, @detail)
`;

/** Create the schema and insert `count` products if the table is empty. */
export function seedDatabase(db, count = TOTAL_PRODUCTS) {
  ensureSchema(db);
  const existing = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  if (existing > 0) return { inserted: 0, existing };

  const insert = db.prepare(INSERT_SQL);
  const insertMany = db.transaction((n) => {
    for (let id = 1; id <= n; id++) insert.run(toRow(generateProduct(id)));
  });
  insertMany(count);
  return { inserted: count, existing: 0 };
}

export { INSERT_SQL };
