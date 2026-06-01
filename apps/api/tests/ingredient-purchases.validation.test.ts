import test from "node:test";
import assert from "node:assert/strict";
import { createIngredientPurchaseSchema } from "../src/modules/ingredient-purchases/ingredient-purchases.validation.js";

test("create ingredient purchase accepts saved supplier with valid lines", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg", unitPrice: 40 }],
  });

  assert.equal(result.success, true);
});

test("create ingredient purchase accepts typed supplier with valid lines", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierName: "Cash market",
    lines: [{ ingredientId: 1, quantity: 500, unit: "g", unitPrice: 12 }],
  });

  assert.equal(result.success, true);
});

test("create ingredient purchase rejects when supplier is missing", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    lines: [{ ingredientId: 1, quantity: 500, unit: "g", unitPrice: 12 }],
  });

  assert.equal(result.success, false);
});

test("create ingredient purchase rejects when both supplier modes are used", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 3,
    supplierName: "Duplicated source",
    lines: [{ ingredientId: 1, quantity: 500, unit: "g", unitPrice: 12 }],
  });

  assert.equal(result.success, false);
});

test("create ingredient purchase rejects duplicate ingredient lines", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    lines: [
      { ingredientId: 1, quantity: 1, unit: "kg", unitPrice: 40 },
      { ingredientId: 1, quantity: 250, unit: "g", unitPrice: 10 },
    ],
  });

  assert.equal(result.success, false);
});

test("create ingredient purchase requires at least one line", () => {
  const result = createIngredientPurchaseSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    lines: [],
  });

  assert.equal(result.success, false);
});
