import test from "node:test";
import assert from "node:assert/strict";
import {
  createExpensePaymentTotalLookup,
  findExpenseTypesBySearchQuery,
  mapExpenseRowToExpense,
  normalizeExpenseSearchQuery,
} from "../src/modules/expenses/expenses.repository.js";

test("maps expense rows into shared expense shape", () => {
  const expense = mapExpenseRowToExpense(
    {
      id: 7,
      type: "salary",
      baseTotal: "2500.000",
      taxState: "inactive",
      taxType: null,
      taxValue: "0.000",
      taxAmount: "0.000",
      totalAfterTax: "2500.000",
      discountState: "active",
      discountType: "amount",
      discountValue: "250.000",
      discountAmount: "250.000",
      finalTotal: "2250.000",
      amount: "2500.000",
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      notes: null,
      employeeName: "Ahmed",
      otherLabel: null,
      createdAt: new Date("2026-05-24T12:05:00.000Z"),
    },
    1000,
  );

  assert.deepEqual(expense, {
    id: 7,
    type: "salary",
    baseTotal: 2500,
    taxState: "inactive",
    taxType: undefined,
    taxValue: 0,
    taxAmount: 0,
    totalAfterTax: 2500,
    discountState: "active",
    discountType: "amount",
    discountValue: 250,
    discountAmount: 250,
    finalTotal: 2250,
    amount: 2500,
    paidAmount: 1000,
    remainingAmount: 1250,
    paymentStatus: "partial",
    occurredAt: "2026-05-24T12:00:00.000Z",
    employeeName: "Ahmed",
    createdAt: "2026-05-24T12:05:00.000Z",
    payments: [],
  });
});

test("normalizes expense search query", () => {
  assert.equal(normalizeExpenseSearchQuery(undefined), undefined);
  assert.equal(normalizeExpenseSearchQuery(""), undefined);
  assert.equal(normalizeExpenseSearchQuery("   "), undefined);
  assert.equal(normalizeExpenseSearchQuery("  Ahmed  "), "Ahmed");
});

test("matches expense types by their Arabic labels", () => {
  assert.deepEqual(findExpenseTypesBySearchQuery("مر"), ["salary"]);
  assert.deepEqual(findExpenseTypesBySearchQuery("ميا"), ["water"]);
  assert.deepEqual(findExpenseTypesBySearchQuery("خرى"), ["other"]);
});

test("creates expense payment total lookup from grouped payment rows", () => {
  const lookup = createExpensePaymentTotalLookup([
    { expenseId: 1, paidAmount: "1000.000" },
    { expenseId: 2, paidAmount: null },
    { expenseId: 3, paidAmount: "250.500" },
  ]);

  assert.equal(lookup.get(1), 1000);
  assert.equal(lookup.get(2), 0);
  assert.equal(lookup.get(3), 250.5);
});
