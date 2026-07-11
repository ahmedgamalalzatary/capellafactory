import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("supplier and buyer account pages", () => {
  test("defines dedicated supplier and buyer account routes", () => {
    const supplierPage = readFileSync(
      resolve(process.cwd(), "src/app/(app)/suppliers/[id]/page.tsx"),
      "utf8",
    );
    const buyerPage = readFileSync(
      resolve(process.cwd(), "src/app/(app)/buyers/[id]/page.tsx"),
      "utf8",
    );

    expect(supplierPage).toContain("AccountInvoicesTable");
    expect(supplierPage).toContain("supplierId");
    expect(buyerPage).toContain("AccountInvoicesTable");
    expect(buyerPage).toContain("buyerId");
  });

  test("account invoice component filters by invoice code and occurredAt", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/accounts/account-invoices-table.tsx"),
      "utf8",
    );

    expect(source).toContain("invoice.invoiceCode");
    expect(source).toContain("occurredAt");
    expect(source).toContain("remainingAmount");
  });
});
