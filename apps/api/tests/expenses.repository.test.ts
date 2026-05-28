import test from "node:test";
import assert from "node:assert/strict";
import {
  findExpenseTypesBySearchQuery,
  mapExpenseRowToExpense,
  normalizeExpenseSearchQuery,
} from "../src/modules/expenses/expenses.repository.js";

test("maps expense rows into shared expense shape", () => {
  const expense = mapExpenseRowToExpense({
    id: 7,
    type: "salary",
    amount: "2500.000",
    occurredAt: new Date("2026-05-24T12:00:00.000Z"),
    notes: null,
    employeeName: "Ahmed",
    otherLabel: null,
    createdAt: new Date("2026-05-24T12:05:00.000Z"),
  });

  assert.deepEqual(expense, {
    id: 7,
    type: "salary",
    amount: 2500,
    occurredAt: "2026-05-24T12:00:00.000Z",
    employeeName: "Ahmed",
    createdAt: "2026-05-24T12:05:00.000Z",
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
