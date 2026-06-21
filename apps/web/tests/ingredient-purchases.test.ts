import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildIngredientPurchaseDetailUrl,
  buildIngredientPurchasesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/ingredient-purchases.js";

test("buildIngredientPurchasesUrl omits empty query by default", () => {
  expect(buildIngredientPurchasesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/ingredient-purchases",
  );
  expect(buildIngredientPurchasesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/ingredient-purchases",
  );
});

test("buildIngredientPurchasesUrl appends trimmed search query", () => {
  expect(
    buildIngredientPurchasesUrl("http://localhost:4000", "  sugar  "),
  ).toBe("http://localhost:4000/ingredient-purchases?q=sugar");
});

test("buildIngredientPurchaseDetailUrl targets one purchase by id", () => {
  expect(buildIngredientPurchaseDetailUrl("http://localhost:4000", 42)).toBe(
    "http://localhost:4000/ingredient-purchases/42",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("IngredientPurchasesTable links each purchase to its detail page", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchases-table.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("/purchases/ingredient-purchases/${purchase.id}");
  expect(source).toContain("عرض");
});

test("IngredientPurchasesTable has a mobile card layout", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchases-table.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("function IngredientPurchaseCard");
  expect(source).toContain("hidden sm:block");
  expect(source).toContain("divide-y sm:hidden");
});

test("ingredient purchase detail page has mobile line cards", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/app/(app)/purchases/ingredient-purchases/[id]/page.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("function IngredientPurchaseLineCard");
  expect(source).toContain("hidden sm:block");
  expect(source).toContain("divide-y sm:hidden");
});

test("ingredient purchase detail page shows payment summary and method", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/app/(app)/purchases/ingredient-purchases/[id]/page.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("paidAmount");
  expect(source).toContain("remainingAmount");
  expect(source).toContain("paymentStatus");
  expect(source).toContain("paymentMethod");
  expect(source).toContain("طريقة الدفع");
});

test("ingredient purchase detail page shows adjustment summary and payment history", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/app/(app)/purchases/ingredient-purchases/[id]/page.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("الملخص المالي");
  expect(source).toContain("baseTotal");
  expect(source).toContain("taxAmount");
  expect(source).toContain("discountAmount");
  expect(source).toContain("finalTotal");
  expect(source).toContain("سجل الدفعات");
  expect(source).toContain("payments.map");
  expect(source).toContain("paidAt");
});

test("ingredient purchases table exposes add payment action for partial invoices", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchases-table.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("remainingAmount");
  expect(source).toContain("إضافة دفعة");
});

test("ingredient purchase form submits line total instead of unit price", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchase-form.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("lineTotal: Number(line.lineTotal)");
  expect(source).not.toContain("unitPrice: Number(line.unitPrice)");
  expect(source).toContain("إجمالي البند");
});

test("ingredient purchase form requires choosing a saved supplier", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchase-form.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("SearchableSelect");
  expect(source).toContain("onChange={setSupplierId}");
  expect(source).not.toContain("supplierMode");
  expect(source).not.toContain('name="supplierName"');
  expect(source).not.toContain("اسم يدوي");
});

test("ingredient purchase dialog copy no longer mentions average costing", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/purchases/ingredients/ingredient-purchase-dialog.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("الحفظ يرفع رصيد الخامات");
  expect(source).not.toContain("يحدّث متوسط التكلفة");
});
