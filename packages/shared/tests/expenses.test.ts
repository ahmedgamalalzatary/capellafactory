import test from "node:test";
import assert from "node:assert/strict";
import { expenseInputSchema } from "../src/expenses/expense.schema.js";

test("expense input accepts salary when employee name is provided", () => {
  const result = expenseInputSchema.safeParse({
    type: "salary",
    amount: 2500,
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
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("expense input rejects other without custom label", () => {
  const result = expenseInputSchema.safeParse({
    type: "other",
    amount: 300,
    occurredAt: "2026-05-24T12:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("expense input strips salary-only and other-only fields from normal expense types", () => {
  const result = expenseInputSchema.safeParse({
    type: "rent",
    amount: 1200,
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
