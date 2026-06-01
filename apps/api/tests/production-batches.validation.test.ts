import test from "node:test";
import assert from "node:assert/strict";
import { createProductionBatchSchema } from "../src/modules/production-batches/production-batches.validation.js";

test("create production batch accepts one product output with ingredient lines", () => {
  const result = createProductionBatchSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg" }],
  });

  assert.equal(result.success, true);
});

test("create production batch rejects duplicate ingredient lines", () => {
  const result = createProductionBatchSchema.safeParse({
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

test("create production batch requires at least one ingredient line", () => {
  const result = createProductionBatchSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    productId: 4,
    producedQuantity: 24,
    lines: [],
  });

  assert.equal(result.success, false);
});
