import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildProductsUrl,
  buildProductActionUrl,
  mergeJsonHeaders,
} from "../src/lib/api/products.js";

test("buildProductsUrl omits empty query and archived filter by default", () => {
  expect(buildProductsUrl("http://localhost:4000", undefined, false)).toBe(
    "http://localhost:4000/products",
  );
  expect(buildProductsUrl("http://localhost:4000", "   ", false)).toBe(
    "http://localhost:4000/products",
  );
});

test("buildProductsUrl appends trimmed search query and archived filter", () => {
  expect(buildProductsUrl("http://localhost:4000", "  Orange  ", true)).toBe(
    "http://localhost:4000/products?q=Orange&archived=true",
  );
});

test("buildProductActionUrl targets reactivation actions", () => {
  expect(buildProductActionUrl("http://localhost:4000", 5, "reactivate")).toBe(
    "http://localhost:4000/products/5/reactivate",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("products table labels derived cost as current stock cost", () => {
  const source = readFileSync(
    path.resolve(import.meta.dirname, "../src/components/inventory/products-table.tsx"),
    "utf8",
  );

  expect(source).toContain("تكلفة الرصيد الحالية");
  expect(source).not.toContain("متوسط التكلفة");
});
