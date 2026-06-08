import test from "node:test";
import assert from "node:assert/strict";
import {
  ProductionBatchValidationError,
  mapProductionBatchLineRow,
  mapProductionBatchRowToProductionBatch,
  normalizeProductionBatchSearchQuery,
  validateProductionBatchStock,
} from "../src/modules/production-batches/production-batches.repository.js";

test("maps production batch lines into shared line shape", () => {
  const line = mapProductionBatchLineRow({
    id: 11,
    ingredientId: 3,
    quantity: "2.500",
    unit: "kg",
    normalizedQuantity: "2500.000",
    unitCost: "0.045250",
    lineCost: "113.125",
  });

  assert.deepEqual(line, {
    id: 11,
    ingredientId: 3,
    quantity: 2.5,
    unit: "kg",
    normalizedQuantity: 2500,
    unitCost: 0.04525,
    lineCost: 113.125,
  });
});

test("maps production batch headers with nested lines", () => {
  const batch = mapProductionBatchRowToProductionBatch(
    {
      id: 9,
      batchCode: "PRD-20260524-0009",
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      productId: 4,
      producedQuantity: "24.000",
      totalCost: "113.125",
      unitCost: "4.713542",
      notes: "first run",
      createdAt: new Date("2026-05-24T12:05:00.000Z"),
    },
    [
      {
        id: 11,
        ingredientId: 3,
        quantity: "2.500",
        unit: "kg",
        normalizedQuantity: "2500.000",
        unitCost: "0.045250",
        lineCost: "113.125",
      },
    ],
  );

  assert.deepEqual(batch, {
    id: 9,
    batchCode: "PRD-20260524-0009",
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    totalCost: 113.125,
    unitCost: 4.713542,
    notes: "first run",
    createdAt: "2026-05-24T12:05:00.000Z",
    lines: [
      {
        id: 11,
        ingredientId: 3,
        quantity: 2.5,
        unit: "kg",
        normalizedQuantity: 2500,
        unitCost: 0.04525,
        lineCost: 113.125,
      },
    ],
  });
});

test("normalizes production batch search query", () => {
  assert.equal(normalizeProductionBatchSearchQuery(undefined), undefined);
  assert.equal(normalizeProductionBatchSearchQuery(""), undefined);
  assert.equal(normalizeProductionBatchSearchQuery("   "), undefined);
  assert.equal(normalizeProductionBatchSearchQuery("  PRD  "), "PRD");
});

test("stock validation rejects insufficient ingredient quantity and names it", () => {
  assert.throws(
    () =>
      validateProductionBatchStock([
        {
          ingredientId: 2,
          ingredientName: "علبه 500مم",
          requestedQuantity: 90,
          availableQuantity: 50,
        },
      ]),
    (error: unknown) =>
      error instanceof ProductionBatchValidationError &&
      error.message === "المخزون غير كافٍ من: علبه 500مم (متاح 50، مطلوب 90)",
  );
});

test("stock validation lists every insufficient ingredient and skips sufficient ones", () => {
  assert.throws(
    () =>
      validateProductionBatchStock([
        {
          ingredientId: 1,
          ingredientName: "مياه مقطره",
          requestedQuantity: 40000,
          availableQuantity: 75000,
        },
        {
          ingredientId: 2,
          ingredientName: "علبه 500مم",
          requestedQuantity: 90,
          availableQuantity: 50,
        },
        {
          ingredientId: 3,
          ingredientName: "زنزان",
          requestedQuantity: 600,
          availableQuantity: 100,
        },
      ]),
    (error: unknown) =>
      error instanceof ProductionBatchValidationError &&
      error.message ===
        "المخزون غير كافٍ من: علبه 500مم (متاح 50، مطلوب 90)؛ زنزان (متاح 100، مطلوب 600)",
  );
});

test("stock validation passes when every ingredient has enough", () => {
  assert.doesNotThrow(() =>
    validateProductionBatchStock([
      {
        ingredientId: 2,
        ingredientName: "علبه 500مم",
        requestedQuantity: 50,
        availableQuantity: 50,
      },
    ]),
  );
});
