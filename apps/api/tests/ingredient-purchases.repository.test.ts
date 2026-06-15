import test from "node:test";
import assert from "node:assert/strict";
import {
  IngredientPurchaseValidationError,
  mapIngredientPurchaseRowToIngredientPurchase,
  mapIngredientPurchaseLineRow,
  normalizeIngredientPurchaseSearchQuery,
  resolveIngredientPurchaseLineCost,
  resolveIngredientPurchaseSupplierFields,
  validateIngredientPurchaseLineUnit,
} from "../src/modules/ingredient-purchases/ingredient-purchases.repository.js";

test("maps ingredient purchase lines into shared line shape", () => {
  const line = mapIngredientPurchaseLineRow({
    id: 11,
    ingredientId: 3,
    quantity: "2.500",
    unit: "kg",
    unitPrice: "45.250",
    lineTotal: "113.125",
    normalizedQuantity: "2500.000",
  });

  assert.deepEqual(line, {
    id: 11,
    ingredientId: 3,
    quantity: 2.5,
    unit: "kg",
    unitPrice: 45.25,
    lineTotal: 113.125,
    normalizedQuantity: 2500,
  });
});

test("maps ingredient purchase headers with nested lines", () => {
  const purchase = mapIngredientPurchaseRowToIngredientPurchase(
    {
      id: 9,
      invoiceCode: "PUR-20260524-0009",
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      supplierId: 4,
      supplierName: null,
      notes: "urgent",
      createdAt: new Date("2026-05-24T12:05:00.000Z"),
    },
    [
      {
        id: 11,
        ingredientId: 3,
        quantity: "2.500",
        unit: "kg",
        unitPrice: "45.250",
        lineTotal: "113.125",
        normalizedQuantity: "2500.000",
      },
    ],
  );

  assert.deepEqual(purchase, {
    id: 9,
    invoiceCode: "PUR-20260524-0009",
    occurredAt: "2026-05-24T12:00:00.000Z",
    supplierId: 4,
    notes: "urgent",
    createdAt: "2026-05-24T12:05:00.000Z",
    lines: [
      {
        id: 11,
        ingredientId: 3,
        quantity: 2.5,
        unit: "kg",
        unitPrice: 45.25,
        lineTotal: 113.125,
        normalizedQuantity: 2500,
      },
    ],
  });
});

test("normalizes ingredient purchase search query", () => {
  assert.equal(normalizeIngredientPurchaseSearchQuery(undefined), undefined);
  assert.equal(normalizeIngredientPurchaseSearchQuery(""), undefined);
  assert.equal(normalizeIngredientPurchaseSearchQuery("   "), undefined);
  assert.equal(normalizeIngredientPurchaseSearchQuery("  sugar  "), "sugar");
});

test("snapshots saved supplier name on ingredient purchase insert", () => {
  assert.deepEqual(
    resolveIngredientPurchaseSupplierFields({ supplierId: 7 }, "Factory Supplier"),
    {
      supplierId: 7,
      supplierName: "Factory Supplier",
    },
  );
});

test("derives ingredient purchase unit price from entered line total", () => {
  assert.deepEqual(resolveIngredientPurchaseLineCost({ quantity: 2.5, lineTotal: 100 }), {
    unitPrice: 40,
    lineTotal: 100,
  });
});

test("accepts unit when it matches ingredient family", () => {
  assert.doesNotThrow(() => validateIngredientPurchaseLineUnit("count", "piece"));
});

test("rejects unit when it does not match ingredient family", () => {
  assert.throws(
    () => validateIngredientPurchaseLineUnit("count", "kg"),
    (error: unknown) =>
      error instanceof IngredientPurchaseValidationError &&
      error.message === "Unit kg is not valid for ingredient family count",
  );
});
