import test from "node:test";
import assert from "node:assert/strict";
import {
  purchaseCorrectionInputSchema,
  purchaseCorrectionSchema,
} from "../src/purchase-corrections/purchase-correction.schema.js";

test("purchase correction input accepts a valid source purchase and lines", () => {
  const result = purchaseCorrectionInputSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "Supplier invoice quantity was entered too high",
    lines: [
      { sourcePurchaseLineId: 11, quantity: 2 },
      { sourcePurchaseLineId: 12, quantity: 1.5 },
    ],
  });

  assert.equal(result.success, true);
});

test("purchase correction input requires a reason", () => {
  const result = purchaseCorrectionInputSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "   ",
    lines: [{ sourcePurchaseLineId: 11, quantity: 2 }],
  });

  assert.equal(result.success, false);
});

test("purchase correction input rejects duplicate source purchase lines", () => {
  const result = purchaseCorrectionInputSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "Duplicate line reversal",
    lines: [
      { sourcePurchaseLineId: 11, quantity: 1 },
      { sourcePurchaseLineId: 11, quantity: 2 },
    ],
  });

  assert.equal(result.success, false);
});

test("purchase correction output schema accepts correction lines", () => {
  const result = purchaseCorrectionSchema.safeParse({
    id: 1,
    sourcePurchaseId: 7,
    sourcePurchaseInvoiceCode: "IP-20260524-0007",
    reason: "Supplier invoice quantity was entered too high",
    createdAt: "2026-05-24T12:00:00.000Z",
    lines: [
      {
        id: 11,
        sourcePurchaseLineId: 20,
        ingredientId: 3,
        quantity: 2,
        unit: "kg",
        unitPrice: 50,
        lineTotal: 100,
        normalizedQuantity: 2000,
      },
    ],
  });

  assert.equal(result.success, true);
});
