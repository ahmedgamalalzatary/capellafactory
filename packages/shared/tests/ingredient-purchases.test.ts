import test from "node:test";
import assert from "node:assert/strict";
import { ingredientPurchaseInputSchema } from "../src/ingredient-purchases/ingredient-purchase.schema.js";

test("ingredient purchase input accepts a saved supplier with valid lines", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    paidAmount: 0,
    notes: " Restock ",
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg", lineTotal: 100 }],
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.notes, "Restock");
  }
});

test("ingredient purchase input rejects typed supplier names", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    paidAmount: 0,
    supplierName: "Cash market",
    lines: [{ ingredientId: 1, quantity: 500, unit: "g", lineTotal: 12 }],
  });

  assert.equal(result.success, false);
});

test("ingredient purchase input rejects duplicate ingredient lines", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    paidAmount: 0,
    lines: [
      { ingredientId: 1, quantity: 1, unit: "kg", lineTotal: 40 },
      { ingredientId: 1, quantity: 250, unit: "g", lineTotal: 10 },
    ],
  });

  assert.equal(result.success, false);
});

test("ingredient purchase input rejects line unit price input", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    paidAmount: 0,
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg", unitPrice: 40 }],
  });

  assert.equal(result.success, false);
});

test("ingredient purchase input accepts partial payment with method and date", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    paidAmount: 50,
    paymentMethod: "visa",
    paidAt: "2026-05-24T12:05:00.000Z",
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg", lineTotal: 100 }],
  });

  assert.equal(result.success, true);
});

test("ingredient purchase input rejects paid amount greater than line total sum", () => {
  const result = ingredientPurchaseInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 7,
    paidAmount: 101,
    paymentMethod: "visa",
    paidAt: "2026-05-24T12:05:00.000Z",
    lines: [{ ingredientId: 1, quantity: 2.5, unit: "kg", lineTotal: 100 }],
  });

  assert.equal(result.success, false);
});
