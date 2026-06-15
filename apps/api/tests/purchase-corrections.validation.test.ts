import test from "node:test";
import assert from "node:assert/strict";
import { createPurchaseCorrectionSchema } from "../src/modules/purchase-corrections/purchase-corrections.validation.js";

test("create purchase correction accepts a valid source purchase and lines", () => {
  const result = createPurchaseCorrectionSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "Supplier invoice quantity was entered too high",
    lines: [
      { sourcePurchaseLineId: 11, quantity: 2 },
      { sourcePurchaseLineId: 12, quantity: 1.5 },
    ],
  });

  assert.equal(result.success, true);
});

test("create purchase correction requires a reason", () => {
  const result = createPurchaseCorrectionSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "   ",
    lines: [{ sourcePurchaseLineId: 11, quantity: 2 }],
  });

  assert.equal(result.success, false);
});

test("create purchase correction rejects duplicate source purchase lines", () => {
  const result = createPurchaseCorrectionSchema.safeParse({
    sourcePurchaseId: 7,
    reason: "Duplicate line reversal",
    lines: [
      { sourcePurchaseLineId: 11, quantity: 1 },
      { sourcePurchaseLineId: 11, quantity: 2 },
    ],
  });

  assert.equal(result.success, false);
});
