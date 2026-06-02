import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildExpenseDetailUrl,
  buildExpensesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/expenses.js";

test("buildExpensesUrl omits empty query by default", () => {
  expect(buildExpensesUrl("http://localhost:4000")).toBe("http://localhost:4000/expenses");
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

test("ExpensesTable links each expense to its detail page", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/purchases/expenses-table.tsx"),
    "utf8",
  );

  expect(source).toContain("/purchases/expenses/${expense.id}");
  expect(source).toContain("عرض");
});
