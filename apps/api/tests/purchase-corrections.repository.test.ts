import test from "node:test";
import assert from "node:assert/strict";
import {
  assemblePurchaseCorrections,
  mapPurchaseCorrectionLineRow,
  mapPurchaseCorrectionRowToPurchaseCorrection,
  normalizePurchaseCorrectionSearchQuery,
  PurchaseCorrectionValidationError,
  getRemainingPurchaseCorrectionQuantity,
  resolvePurchaseCorrectionLineAmounts,
  validatePurchaseCorrectionQuantity,
} from "../src/modules/purchase-corrections/purchase-corrections.repository.js";

test("derives correction line amounts proportionally from the source purchase line", () => {
  assert.deepEqual(
    resolvePurchaseCorrectionLineAmounts({
      sourceQuantity: 12,
      sourceLineTotal: 300,
      correctionQuantity: 2,
    }),
    {
      unitPrice: 25,
      lineTotal: 50,
    },
  );
});

test("rejects amount derivation when the source quantity is zero", () => {
  assert.throws(
    () =>
      resolvePurchaseCorrectionLineAmounts({
        sourceQuantity: 0,
        sourceLineTotal: 300,
        correctionQuantity: 2,
      }),
    (error: unknown) =>
      error instanceof PurchaseCorrectionValidationError &&
      error.message === "Source purchase line quantity must be greater than zero",
  );
});

test("maps purchase correction lines into shared line shape", () => {
  const line = mapPurchaseCorrectionLineRow({
    id: 4,
    sourcePurchaseLineId: 11,
    ingredientId: 3,
    quantity: "2.000",
    unit: "kg",
    unitPrice: "25.000",
    lineTotal: "50.000",
    normalizedQuantity: "2000.000",
  });

  assert.deepEqual(line, {
    id: 4,
    sourcePurchaseLineId: 11,
    ingredientId: 3,
    quantity: 2,
    unit: "kg",
    unitPrice: 25,
    lineTotal: 50,
    normalizedQuantity: 2000,
  });
});

test("maps purchase correction headers with nested lines", () => {
  const correction = mapPurchaseCorrectionRowToPurchaseCorrection(
    {
      id: 9,
      sourcePurchaseId: 3,
      reason: "Qty entered too high",
      createdAt: new Date("2026-05-24T12:05:00.000Z"),
    },
    [
      {
        id: 4,
        sourcePurchaseLineId: 11,
        ingredientId: 3,
        quantity: "2.000",
        unit: "kg",
        unitPrice: "25.000",
        lineTotal: "50.000",
        normalizedQuantity: "2000.000",
      },
    ],
  );

  assert.deepEqual(correction, {
    id: 9,
    sourcePurchaseId: 3,
    reason: "Qty entered too high",
    createdAt: "2026-05-24T12:05:00.000Z",
    lines: [
      {
        id: 4,
        sourcePurchaseLineId: 11,
        ingredientId: 3,
        quantity: 2,
        unit: "kg",
        unitPrice: 25,
        lineTotal: 50,
        normalizedQuantity: 2000,
      },
    ],
  });
});

test("assembles purchase corrections from headers and lines without null entries", () => {
  const corrections = assemblePurchaseCorrections(
    [
      {
        id: 9,
        sourcePurchaseId: 3,
        reason: "Qty entered too high",
        createdAt: new Date("2026-05-24T12:05:00.000Z"),
      },
      {
        id: 10,
        sourcePurchaseId: 4,
        sourcePurchaseInvoiceCode: "INV-10",
        reason: "Damaged items removed",
        createdAt: "2026-05-25T08:00:00.000Z",
      },
    ],
    [
      {
        id: 4,
        correctionId: 9,
        sourcePurchaseLineId: 11,
        ingredientId: 3,
        quantity: "2.000",
        unit: "kg",
        unitPrice: "25.000",
        lineTotal: "50.000",
        normalizedQuantity: "2000.000",
      },
      {
        id: 5,
        correctionId: 10,
        sourcePurchaseLineId: 12,
        ingredientId: 8,
        quantity: "1.000",
        unit: "L",
        unitPrice: "10.000",
        lineTotal: "10.000",
        normalizedQuantity: "1000.000",
      },
    ],
  );

  assert.deepEqual(corrections, [
    {
      id: 9,
      sourcePurchaseId: 3,
      reason: "Qty entered too high",
      createdAt: "2026-05-24T12:05:00.000Z",
      lines: [
        {
          id: 4,
          sourcePurchaseLineId: 11,
          ingredientId: 3,
          quantity: 2,
          unit: "kg",
          unitPrice: 25,
          lineTotal: 50,
          normalizedQuantity: 2000,
        },
      ],
    },
    {
      id: 10,
      sourcePurchaseId: 4,
      sourcePurchaseInvoiceCode: "INV-10",
      reason: "Damaged items removed",
      createdAt: "2026-05-25T08:00:00.000Z",
      lines: [
        {
          id: 5,
          sourcePurchaseLineId: 12,
          ingredientId: 8,
          quantity: 1,
          unit: "L",
          unitPrice: 10,
          lineTotal: 10,
          normalizedQuantity: 1000,
        },
      ],
    },
  ]);
});

test("normalizes purchase correction search query", () => {
  assert.equal(normalizePurchaseCorrectionSearchQuery(undefined), undefined);
  assert.equal(normalizePurchaseCorrectionSearchQuery(""), undefined);
  assert.equal(normalizePurchaseCorrectionSearchQuery("   "), undefined);
  assert.equal(normalizePurchaseCorrectionSearchQuery("  too high  "), "too high");
});

test("computes remaining reversible quantity from the source line quantity and prior corrections", () => {
  assert.equal(getRemainingPurchaseCorrectionQuantity(12, 5), 7);
});

test("rejects correction quantity that exceeds the remaining reversible quantity", () => {
  assert.throws(
    () =>
      validatePurchaseCorrectionQuantity({
        ingredientName: "Sugar",
        requestedQuantity: 8,
        remainingQuantity: 7,
      }),
    (error: unknown) =>
      error instanceof PurchaseCorrectionValidationError &&
      error.message === "Correction quantity exceeds remaining reversible quantity for Sugar",
  );
});
