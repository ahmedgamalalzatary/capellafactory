import { expect, test } from "vitest";
import {
  buildSalesInvoiceDetailUrl,
  buildSalesInvoicesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/sales-invoices.js";

test("buildSalesInvoicesUrl omits empty query by default", () => {
  expect(buildSalesInvoicesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/sales-invoices",
  );
  expect(buildSalesInvoicesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/sales-invoices",
  );
});

test("buildSalesInvoicesUrl appends trimmed search query", () => {
  expect(buildSalesInvoicesUrl("http://localhost:4000", "  SAL  ")).toBe(
    "http://localhost:4000/sales-invoices?q=SAL",
  );
});

test("buildSalesInvoiceDetailUrl targets one sales invoice by id", () => {
  expect(buildSalesInvoiceDetailUrl("http://localhost:4000", 42)).toBe(
    "http://localhost:4000/sales-invoices/42",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});
