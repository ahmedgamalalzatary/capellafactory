import test from "node:test";
import assert from "node:assert/strict";
import { productionBatchInputSchema } from "../src/production-batches/production-batch.schema.js";

test("production batch input accepts one product output with ingredient lines", () => {
  const result = productionBatchInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    notes: " Morning batch ",
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg" }],
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.notes, "Morning batch");
  }
});

test("production batch input rejects duplicate ingredient lines", () => {
  const result = productionBatchInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    lines: [
      { ingredientId: 1, quantity: 1, unit: "kg" },
      { ingredientId: 1, quantity: 500, unit: "g" },
    ],
  });

  assert.equal(result.success, false);
});

test("production batch input requires at least one ingredient line", () => {
  const result = productionBatchInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    lines: [],
  });

  assert.equal(result.success, false);
});
