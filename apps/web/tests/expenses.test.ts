import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildExpenseDetailUrl,
  buildExpensesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/expenses.js";
import { handleApiResponse } from "../src/lib/api/request.js";

test("buildExpensesUrl omits empty query by default", () => {
  expect(buildExpensesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/expenses",
  );
  expect(buildExpensesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/expenses",
  );
});

test("buildExpensesUrl appends trimmed search query", () => {
  expect(buildExpensesUrl("http://localhost:4000", "  salary  ")).toBe(
    "http://localhost:4000/expenses?q=salary",
  );
});

test("buildExpenseDetailUrl targets one expense by id", () => {
  expect(buildExpenseDetailUrl("http://localhost:4000", 42)).toBe(
    "http://localhost:4000/expenses/42",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("handleApiResponse reports the first validation issue", async () => {
  const response = new Response(
    JSON.stringify({ issues: [{ message: "Amount is required" }] }),
    { status: 400 },
  );

  await expect(
    handleApiResponse(response, "Expense request failed"),
  ).rejects.toThrow("Amount is required");
});

test("ExpensesTable links each expense to its detail page", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/purchases/expenses/expenses-table.tsx"),
    "utf8",
  );

  expect(source).toContain("/purchases/expenses/${expense.id}");
  expect(source).toContain("عرض");
});

test("expense detail page falls back to notFound when the fetch fails", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/(app)/purchases/expenses/[id]/page.tsx"),
    "utf8",
  );

  expect(source).toContain("getExpense(expenseId, { cookieHeader }).catch(() => null)");
  expect(source).toContain("if (!expense) {");
  expect(source).toContain("notFound();");
});

test("expense detail page shows financial summary and payment history", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/(app)/purchases/expenses/[id]/page.tsx"),
    "utf8",
  );

  expect(source).toContain("الملخص المالي");
  expect(source).toContain("baseTotal");
  expect(source).toContain("taxAmount");
  expect(source).toContain("discountAmount");
  expect(source).toContain("finalTotal");
  expect(source).toContain("سجل الدفعات");
  expect(source).toContain("payments");
  expect(source).toContain("paidAt");
  expect(source).toContain("employeeName");
  expect(source).toContain("otherLabel");
});
