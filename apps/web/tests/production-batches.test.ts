import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildProductionBatchDetailUrl,
  buildProductionBatchesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/production-batches.js";

test("buildProductionBatchesUrl omits empty query by default", () => {
  expect(buildProductionBatchesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/production-batches",
  );
  expect(buildProductionBatchesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/production-batches",
  );
});

test("buildProductionBatchesUrl appends trimmed search query", () => {
  expect(buildProductionBatchesUrl("http://localhost:4000", "  PRD  ")).toBe(
    "http://localhost:4000/production-batches?q=PRD",
  );
});

test("buildProductionBatchDetailUrl targets one production batch by id", () => {
  expect(buildProductionBatchDetailUrl("http://localhost:4000", 42)).toBe(
    "http://localhost:4000/production-batches/42",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("ProductionBatchesTable links each batch to its detail page", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/production/production-batches-table.tsx"),
    "utf8",
  );

  expect(source).toContain("/products/production-batches/${batch.id}");
  expect(source).toContain("عرض");
});

test("ProductionBatchesTable has a mobile card layout", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/production/production-batches-table.tsx"),
    "utf8",
  );

  expect(source).toContain("function ProductionBatchCard");
  expect(source).toContain("hidden sm:block");
  expect(source).toContain("divide-y sm:hidden");
});

test("production batch detail page has mobile line cards", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/products/production-batches/[id]/page.tsx"),
    "utf8",
  );

  expect(source).toContain("function ProductionBatchLineCard");
  expect(source).toContain("hidden sm:block");
  expect(source).toContain("divide-y sm:hidden");
});
