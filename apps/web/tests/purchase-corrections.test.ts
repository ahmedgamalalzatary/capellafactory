import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPurchaseCorrectionDetailUrl,
  buildPurchaseCorrectionsUrl,
} from "../src/lib/api/purchase-corrections.js";

test("buildPurchaseCorrectionsUrl omits empty query by default", () => {
  expect(buildPurchaseCorrectionsUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/purchase-corrections",
  );
  expect(buildPurchaseCorrectionsUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/purchase-corrections",
  );
});

test("buildPurchaseCorrectionsUrl appends trimmed search query", () => {
  expect(
    buildPurchaseCorrectionsUrl("http://localhost:4000", "  mistake  "),
  ).toBe("http://localhost:4000/purchase-corrections?q=mistake");
});

test("buildPurchaseCorrectionDetailUrl targets one correction by id", () => {
  expect(buildPurchaseCorrectionDetailUrl("http://localhost:4000", 42)).toBe(
    "http://localhost:4000/purchase-corrections/42",
  );
});

test("purchases page exposes a purchase corrections tab and dialog", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/(app)/purchases/page.tsx"),
    "utf8",
  );

  expect(source).toContain("purchase-corrections");
  expect(source).toContain("PurchaseCorrectionDialog");
  expect(source).toContain("PurchaseCorrectionsTable");
});

test("purchase corrections table links each correction to its detail page", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/components/purchases/purchase-correction/purchase-corrections-table.tsx"),
    "utf8",
  );

  expect(source).toContain("/purchases/purchase-corrections/${correction.id}");
});
