import { expect, test } from "vitest";
import { buildExpensesUrl, mergeJsonHeaders } from "../src/lib/api/expenses.js";

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

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});
