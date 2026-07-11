import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIngredientPurchaseStockLayer,
  resolveIngredientPurchaseLineCost,
  resolveIngredientPurchaseSupplierFields,
} from "../src/modules/ingredient-purchases/ingredient-purchases.allocation.js";
import {
  assembleIngredientPurchases,
  createIngredientPurchasePaymentTotalLookup,
  compareIngredientPurchaseListOrder,
  mapIngredientPurchaseRowToIngredientPurchase,
  mapIngredientPurchaseLineRow,
  normalizeIngredientPurchaseSearchQuery,
} from "../src/modules/ingredient-purchases/ingredient-purchases.mappers.js";
import {
  IngredientPurchaseValidationError,
  validateIngredientPurchaseLineUnit,
} from "../src/modules/ingredient-purchases/ingredient-purchases.validators.js";

test("assembles ingredient purchases from batched rows, lines, payment totals, and payments", () => {
  const baseRow = {
    invoiceCode: "PUR-20260101-0001",
    occurredAt: new Date("2026-01-01T10:00:00.000Z"),
    baseTotal: "100.000",
    taxState: "inactive" as const,
    taxType: null,
    taxValue: "0.000",
    taxAmount: "0.000",
    totalAfterTax: "100.000",
    discountState: "inactive" as const,
    discountType: null,
    discountValue: "0.000",
    discountAmount: "0.000",
    finalTotal: "100.000",
    totalAmount: "100.000",
    supplierId: 4,
    supplierName: "Cairo Mills",
    notes: null,
    createdAt: new Date("2026-01-01T10:05:00.000Z"),
  };

  const purchases = assembleIngredientPurchases(
    [
      { ...baseRow, id: 1 },
      { ...baseRow, id: 2, invoiceCode: "PUR-20260102-0002" },
    ],
    [
      {
        purchaseId: 2,
        id: 21,
        ingredientId: 4,
        quantity: "1.000",
        unit: "kg",
        unitPrice: "100.000",
        lineTotal: "100.000",
        normalizedQuantity: "1000.000",
      },
      {
        purchaseId: 1,
        id: 11,
        ingredientId: 3,
        quantity: "2.000",
        unit: "kg",
        unitPrice: "50.000",
        lineTotal: "100.000",
        normalizedQuantity: "2000.000",
      },
    ],
    new Map([[1, 40]]),
    [
      {
        purchaseId: 1,
        id: 5,
        amount: "40.000",
        paymentMethod: "cod",
        paidAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ],
  );

  assert.deepEqual(
    purchases.map((purchase) => ({
      id: purchase.id,
      lineIds: purchase.lines.map((line) => line.id),
      paidAmount: purchase.paidAmount,
      paymentStatus: purchase.paymentStatus,
      paymentIds: purchase.payments.map((payment) => payment.id),
    })),
    [
      { id: 1, lineIds: [11], paidAmount: 40, paymentStatus: "partial", paymentIds: [5] },
      { id: 2, lineIds: [21], paidAmount: 0, paymentStatus: "unpaid", paymentIds: [] },
    ],
  );
});

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
      baseTotal: "100.000",
      taxState: "active",
      taxType: "percentage",
      taxValue: "14.000",
      taxAmount: "14.000",
      totalAfterTax: "114.000",
      discountState: "active",
      discountType: "amount",
      discountValue: "5.000",
      discountAmount: "5.000",
      finalTotal: "109.000",
      totalAmount: "113.125",
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
    50,
    [
      {
        id: 3,
        amount: "50.000",
        paymentMethod: "instapay",
        paidAt: new Date("2026-05-24T12:01:00.000Z"),
      },
    ],
  );

  assert.deepEqual(purchase, {
    id: 9,
    invoiceCode: "PUR-20260524-0009",
    occurredAt: "2026-05-24T12:00:00.000Z",
    baseTotal: 100,
    taxState: "active",
    taxType: "percentage",
    taxValue: 14,
    taxAmount: 14,
    totalAfterTax: 114,
    discountState: "active",
    discountType: "amount",
    discountValue: 5,
    discountAmount: 5,
    finalTotal: 109,
    totalAmount: 113.125,
    paidAmount: 50,
    remainingAmount: 59,
    paymentStatus: "partial",
    supplierId: 4,
    notes: "urgent",
    createdAt: "2026-05-24T12:05:00.000Z",
    payments: [
      {
        id: 3,
        amount: 50,
        paymentMethod: "instapay",
        paidAt: "2026-05-24T12:01:00.000Z",
      },
    ],
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

test("creates ingredient purchase payment total lookup from grouped payment rows", () => {
  const lookup = createIngredientPurchasePaymentTotalLookup([
    { purchaseId: 1, paidAmount: "1000.000" },
    { purchaseId: 2, paidAmount: null },
  ]);

  assert.equal(lookup.get(1), 1000);
  assert.equal(lookup.get(2), 0);
});

test("orders ingredient purchases by createdAt descending before occurredAt", () => {
  const purchases = [
    {
      id: 1,
      invoiceCode: "PUR-20260619-0001",
      occurredAt: "2026-06-19T10:00:00.000Z",
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: "paid",
      createdAt: "2026-06-19T10:00:00.000Z",
      payments: [],
      lines: [],
    },
    {
      id: 2,
      invoiceCode: "PUR-20260618-0002",
      occurredAt: "2026-06-18T10:00:00.000Z",
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: "paid",
      createdAt: "2026-06-19T11:00:00.000Z",
      payments: [],
      lines: [],
    },
  ];

  purchases.sort(compareIngredientPurchaseListOrder);

  assert.deepEqual(
    purchases.map((purchase) => purchase.id),
    [2, 1],
  );
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
  assert.deepEqual(
    resolveIngredientPurchaseLineCost({
      quantity: 2.5,
      lineTotal: 100,
    }),
    {
    unitPrice: 40,
    lineTotal: 100,
    },
  );
});

test("builds one inbound fifo stock layer per ingredient purchase line", () => {
  assert.deepEqual(
    buildIngredientPurchaseStockLayer({
      purchaseId: 9,
      purchaseLineId: 11,
      ingredientId: 3,
      normalizedQuantity: 2500,
      lineTotal: 113.125,
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
    }),
    {
      domain: "ingredient",
      itemId: 3,
      sourceDocumentType: "ingredient-purchase",
      sourceDocumentId: 9,
      sourceLineId: 11,
      originalQuantity: "2500.000",
      remainingQuantity: "2500.000",
      unitCost: "0.045250",
      totalCost: "113.125",
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
    },
  );
});

test("rejects ingredient purchase stock layers with zero normalized quantity", () => {
  assert.throws(
    () =>
      buildIngredientPurchaseStockLayer({
        purchaseId: 9,
        purchaseLineId: 11,
        ingredientId: 3,
        normalizedQuantity: 0,
        lineTotal: 113.125,
        occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      }),
    (error: unknown) =>
      error instanceof IngredientPurchaseValidationError &&
      error.message === "كمية سطر شراء الخامة يجب أن تكون أكبر من صفر",
  );
});

test("accepts unit when it matches ingredient family", () => {
  assert.doesNotThrow(() => validateIngredientPurchaseLineUnit("count", "piece"));
});

test("rejects unit when it does not match ingredient family", () => {
  assert.throws(
    () => validateIngredientPurchaseLineUnit("count", "kg"),
    (error: unknown) =>
      error instanceof IngredientPurchaseValidationError &&
      error.message === "الوحدة kg غير صالحة لفئة الخامة العدد",
  );
});
