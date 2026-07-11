import test from "node:test";
import assert from "node:assert/strict";
import {
  DuplicateProductNameError,
  mapProductRowToProduct,
  normalizeProductSearchQuery,
  toProductDatabaseError,
} from "../src/modules/products/products.repository.js";

test("maps product rows into shared product shape", () => {
  const product = mapProductRowToProduct({
    id: 7,
    name: "Orange Syrup",
    stockQuantity: "48.250",
    averageUnitCost: "4.713542",
    hasHistory: false,
    isArchived: true,
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(product, {
    id: 7,
    name: "Orange Syrup",
    stockQuantity: 48.25,
    averageUnitCost: 4.713542,
    hasHistory: false,
    isArchived: true,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps mysql duplicate key errors to DuplicateProductNameError", () => {
  const mysqlError = {
    code: "ER_DUP_ENTRY",
    sqlMessage: "Duplicate entry 'Orange Syrup' for key 'products.name'",
  } as unknown as NodeJS.ErrnoException;

  const error = toProductDatabaseError(mysqlError);

  assert.ok(error instanceof DuplicateProductNameError);
  assert.equal(error.message, "اسم المنتج مستخدم بالفعل");
});

test("normalizes product search query", () => {
  assert.equal(normalizeProductSearchQuery(undefined), undefined);
  assert.equal(normalizeProductSearchQuery(""), undefined);
  assert.equal(normalizeProductSearchQuery("   "), undefined);
  assert.equal(normalizeProductSearchQuery("  Orange  "), "Orange");
});
