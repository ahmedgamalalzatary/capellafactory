import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const here = __dirname;

function loadRootEnv() {
  try {
    const raw = readFileSync(path.join(here, "../../../.env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // No .env file; fall back to whatever is already in the environment.
  }
}

loadRootEnv();

const TEST_DB_NAME = process.env.TEST_DB_NAME ?? "capella_factory_test";
process.env.DB_NAME = TEST_DB_NAME;

const connectionConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
};

const TABLES = [
  "production_batch_lines",
  "production_batches",
  "ingredient_purchase_lines",
  "ingredient_purchases",
  "ingredients",
  "products",
];

let dbAvailable = false;
let pool: mysql.Pool | undefined;
let repo:
  | typeof import("../src/modules/production-batches/production-batches.repository.js")
  | undefined;

before(async () => {
  try {
    const admin = await mysql.createConnection({ ...connectionConfig, connectTimeout: 2000 });
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\``);
    await admin.end();

    pool = mysql.createPool({ ...connectionConfig, database: TEST_DB_NAME });
    await migrate(drizzle(pool), {
      migrationsFolder: path.join(here, "../drizzle/migrations"),
    });

    repo = await import("../src/modules/production-batches/production-batches.repository.js");
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
});

async function resetTables() {
  if (!pool) return;

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of TABLES) {
    await pool.query(`TRUNCATE TABLE \`${table}\``);
  }
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function seedProduct(name: string) {
  const [result] = await pool!.execute("INSERT INTO products (name) VALUES (?)", [name]);
  return (result as mysql.ResultSetHeader).insertId;
}

async function seedIngredientWithStock(name: string, stockQuantity: string, averageUnitCost: string) {
  const [result] = await pool!.execute(
    `INSERT INTO ingredients (name, unit_family, base_unit, stock_quantity, average_unit_cost, has_history)
     VALUES (?, 'count', 'piece', ?, ?, true)`,
    [name, stockQuantity, averageUnitCost],
  );
  return (result as mysql.ResultSetHeader).insertId;
}

async function seedPurchase(ingredientId: number, occurredAt: string, quantity: string, lineTotal: string) {
  const [header] = await pool!.execute(
    "INSERT INTO ingredient_purchases (invoice_code, occurred_at) VALUES (?, ?)",
    [`TEST-PUR-${Date.now()}-${ingredientId}`, occurredAt],
  );
  const purchaseId = (header as mysql.ResultSetHeader).insertId;

  await pool!.execute(
    `INSERT INTO ingredient_purchase_lines
       (purchase_id, ingredient_id, quantity, unit, unit_price, line_total, normalized_quantity)
     VALUES (?, ?, ?, 'piece', ?, ?, ?)`,
    [purchaseId, ingredientId, quantity, lineTotal, lineTotal, quantity],
  );

  return purchaseId;
}

async function countRows(table: string) {
  const [rows] = await pool!.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  return Number((rows as mysql.RowDataPacket[])[0].count);
}

beforeEach(async () => {
  await resetTables();
});

after(async () => {
  await resetTables();
  await pool?.end();
  setImmediate(() => process.exit(0));
});

test(
  "rejects a backdated batch whose replay over-consumes, returning a domain error and persisting no rows",
  async (t) => {
    if (!dbAvailable) {
      t.skip("MySQL test database unavailable");
      return;
    }

    assert.ok(pool && repo);

    const productId = await seedProduct(`TEST_PROD_CONFLICT_${Date.now()}`);
    const conflictIngredientName = `TEST_ING_CONFLICT_${Date.now()}`;
    const ingredientId = await seedIngredientWithStock(
      conflictIngredientName,
      "500.000",
      "0.100000",
    );
    await seedPurchase(ingredientId, "2026-05-02 00:00:00", "500.000", "50.000");

    await assert.rejects(
      () =>
        repo!.createProductionBatch({
          occurredAt: "2026-05-01T00:00:00.000Z",
          productId,
          producedQuantity: 100,
          lines: [{ ingredientId, quantity: 300, unit: "piece" }],
        }),
      (error: unknown) =>
        error instanceof repo!.ProductionBatchValidationError &&
        error.message.includes("سجل لاحق") &&
        error.message.includes(conflictIngredientName),
    );

    assert.equal(await countRows("production_batches"), 0);
    assert.equal(await countRows("production_batch_lines"), 0);
  },
);

test(
  "commits a valid batch and reduces ingredient stock",
  async (t) => {
    if (!dbAvailable) {
      t.skip("MySQL test database unavailable");
      return;
    }

    assert.ok(pool && repo);

    const productId = await seedProduct(`TEST_PROD_OK_${Date.now()}`);
    const ingredientId = await seedIngredientWithStock(
      `TEST_ING_OK_${Date.now()}`,
      "500.000",
      "0.100000",
    );
    await seedPurchase(ingredientId, "2026-05-01 00:00:00", "500.000", "50.000");

    const batch = await repo.createProductionBatch({
      occurredAt: "2026-05-02T00:00:00.000Z",
      productId,
      producedQuantity: 100,
      lines: [{ ingredientId, quantity: 200, unit: "piece" }],
    });

    assert.equal(batch.lines.length, 1);
    assert.equal(await countRows("production_batches"), 1);

    const [ingredientRows] = await pool.query(
      "SELECT stock_quantity FROM ingredients WHERE id = ?",
      [ingredientId],
    );
    const remaining = Number((ingredientRows as mysql.RowDataPacket[])[0].stock_quantity);
    assert.equal(remaining, 300);
  },
);