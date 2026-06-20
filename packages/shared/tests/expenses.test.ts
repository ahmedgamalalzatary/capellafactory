import test from "node:test";
import assert from "node:assert/strict";
import { expenseInputSchema } from "../src/expenses/expense.schema.js";

test("expense input accepts salary when employee name is provided", () => {
  const result = expenseInputSchema.safeParse({
    type: "salary",
    amount: 2500,
    paidAmount: 0,
    occurredAt: "2026-05-24T12:00:00.000Z",
    employeeName: " Ahmed ",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.employeeName, "Ahmed");
  }
});

test("expense input rejects salary without employee name", () => {
  const result = expenseInputSchema.safeParse({
    type: "salary",
    amount: 2500,
    paidAmount: 0,
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("expense input rejects other without custom label", () => {
  const result = expenseInputSchema.safeParse({
    type: "other",
    amount: 300,
    paidAmount: 0,
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("expense input strips salary-only and other-only fields from normal expense types", () => {
  const result = expenseInputSchema.safeParse({
    type: "rent",
    amount: 1200,
    paidAmount: 0,
    occurredAt: "2026-05-24T12:00:00.000Z",
    employeeName: "Should not stay",
    otherLabel: "Should not stay",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.employeeName, undefined);
    assert.equal(result.data.otherLabel, undefined);
  }
});

test("expense input accepts a partial payment with method and date", () => {
  const result = expenseInputSchema.safeParse({
    type: "rent",
    amount: 40000,
    paidAmount: 37000,
    paymentMethod: "instapay",
    paidAt: "2026-06-20T10:00:00.000Z",
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.paidAmount, 37000);
    assert.equal(result.data.paymentMethod, "instapay");
  }
});

test("expense input rejects a positive paid amount without method", () => {
  const result = expenseInputSchema.safeParse({
    type: "rent",
    amount: 40000,
    paidAmount: 37000,
    paidAt: "2026-06-20T10:00:00.000Z",
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});
