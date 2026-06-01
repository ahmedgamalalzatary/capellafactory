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

test("stock validation rejects insufficient ingredient quantity", () => {
  assert.throws(
    () =>
      validateProductionBatchStock([
        {
          ingredientId: 2,
          requestedQuantity: 1500,
          availableQuantity: 1000,
        },
      ]),
    (error: unknown) =>
      error instanceof ProductionBatchValidationError &&
      error.message === "Insufficient ingredient stock",
  );
});
