import { describe, expect, test } from "vitest";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Expense } from "@capella/shared/expenses/expense.types";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Product } from "@capella/shared/products/product.types";
import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { PurchaseCorrection } from "@capella/shared/purchase-corrections/purchase-correction.types";
import type { SalesInvoice } from "@capella/shared/sales-invoices/sales-invoice.types";

import {
  buildReportDownloadName,
  buildReportsHref,
  filterReportsDataByCreatedAt,
  getReportTabs,
  normalizeReportsDateFilter,
  summarizeReports,
} from "@/app/utils/utils.reports";

describe("reports helpers", () => {
  test("defines the approved reports tabs in display order", () => {
    expect(getReportTabs().map((tab) => tab.key)).toEqual([
      "overview",
      "expenses",
      "ingredient-purchases",
      "purchase-corrections",
      "production-batches",
      "sales",
      "supplier-debts",
      "buyer-debts",
    ]);
  });

  test("builds a stable report tab href and pdf filename", () => {
    expect(buildReportsHref("sales")).toBe("/reports?tab=sales");
    expect(
      buildReportsHref("sales", { from: "2026-06-01", to: "2026-06-21" }),
    ).toBe("/reports?tab=sales&from=2026-06-01&to=2026-06-21");
    expect(buildReportDownloadName("ingredient-purchases")).toBe(
      "capella-ingredient-purchases-report.pdf",
    );
    expect(buildReportsHref("supplier-debts")).toBe("/reports?tab=supplier-debts");
  });

  test("normalizes custom report dates and fills missing sides", () => {
    expect(
      normalizeReportsDateFilter(
        { from: "2026-06-05" },
        new Date("2026-06-21T12:00:00.000Z"),
      ),
    ).toEqual({
      from: "2026-06-05",
      to: "2026-06-21",
    });

    expect(
      normalizeReportsDateFilter(
        { to: "2026-06-05" },
        new Date("2026-06-21T12:00:00.000Z"),
      ),
    ).toEqual({
      from: "2026-06-05",
      to: "2026-06-05",
    });

    expect(
      normalizeReportsDateFilter(
        { from: "2026-06-20", to: "2026-06-10" },
        new Date("2026-06-21T12:00:00.000Z"),
      ),
    ).toEqual({
      from: "2026-06-10",
      to: "2026-06-20",
    });
  });

  test("filters report collections by the active business time field for a custom date range", () => {
    const data = {
      buyers: [
        { id: 1, createdAt: "2026-06-15T12:00:00.000Z" } as Buyer,
        { id: 2, createdAt: "2026-06-01T12:00:00.000Z" } as Buyer,
      ],
      suppliers: [{ id: 1, createdAt: "2026-06-10T12:00:00.000Z" }] as never,
      ingredients: [],
      products: [],
      expenses: [
        {
          id: 1,
          amount: 10,
          createdAt: "2026-06-16T10:00:00.000Z",
          occurredAt: "2026-01-01T00:00:00.000Z",
        } as Expense,
        {
          id: 2,
          amount: 20,
          createdAt: "2026-05-01T10:00:00.000Z",
          occurredAt: "2026-06-16T00:00:00.000Z",
        } as Expense,
      ],
      ingredientPurchases: [],
      purchaseCorrections: [],
      productionBatches: [
        {
          id: 1,
          createdAt: "2026-06-09T12:00:00.000Z",
          occurredAt: "2026-06-16T00:00:00.000Z",
          totalCost: 80,
        } as ProductionBatch,
      ],
      salesInvoices: [
        {
          id: 1,
          createdAt: "2026-06-15T12:00:00.000Z",
          occurredAt: "2026-01-01T00:00:00.000Z",
          subtotal: 200,
          grossProfit: 80,
          totalCost: 120,
        } as SalesInvoice,
      ],
    };

    const filtered = filterReportsDataByCreatedAt(
      data,
      { from: "2026-06-09", to: "2026-06-16" },
    );

    expect(filtered.buyers.map((buyer) => buyer.id)).toEqual([1]);
    expect(filtered.suppliers).toHaveLength(1);
    expect(filtered.expenses.map((expense) => expense.id)).toEqual([2]);
    expect(filtered.productionBatches.map((batch) => batch.id)).toEqual([1]);
    expect(filtered.salesInvoices).toHaveLength(0);

    expect(
      filterReportsDataByCreatedAt(data, { from: "2026-06-16", to: "2026-06-16" })
        .productionBatches,
    ).toHaveLength(1);
    expect(filterReportsDataByCreatedAt(data, {}).buyers).toHaveLength(2);
  });

  test("filters every reports collection inclusively for a custom date range", () => {
    const data = {
      buyers: [
        { id: 1, createdAt: "2026-06-10T00:00:00.000Z" } as Buyer,
        { id: 2, createdAt: "2026-06-12T23:59:59.999Z" } as Buyer,
        { id: 3, createdAt: "2026-06-13T00:00:00.000Z" } as Buyer,
      ],
      suppliers: [],
      ingredients: [],
      products: [],
      expenses: [],
      ingredientPurchases: [],
      purchaseCorrections: [],
      productionBatches: [],
      salesInvoices: [],
    };

    const filtered = filterReportsDataByCreatedAt(data, {
      from: "2026-06-10",
      to: "2026-06-12",
    });

    expect(filtered.buyers.map((buyer) => buyer.id)).toEqual([1, 2]);
  });

  test("uses the business time field for each report collection", () => {
    const data = {
      buyers: [{ id: 1, createdAt: "2026-06-15T12:00:00.000Z" } as Buyer],
      suppliers: [{ id: 1, createdAt: "2026-06-15T12:00:00.000Z" }] as never,
      ingredients: [],
      products: [],
      expenses: [
        {
          id: 1,
          amount: 10,
          createdAt: "2026-06-01T10:00:00.000Z",
          occurredAt: "2026-06-16T10:00:00.000Z",
        } as Expense,
      ],
      ingredientPurchases: [
        {
          id: 1,
          invoiceCode: "PUR-001",
          createdAt: "2026-06-01T10:00:00.000Z",
          occurredAt: "2026-06-16T10:00:00.000Z",
          baseTotal: 0,
          taxState: "inactive",
          taxValue: 0,
          taxAmount: 0,
          totalAfterTax: 0,
          discountState: "inactive",
          discountValue: 0,
          discountAmount: 0,
          finalTotal: 0,
          lines: [],
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          paymentStatus: "paid",
          payments: [],
        } as IngredientPurchase,
      ],
      purchaseCorrections: [
        {
          id: 1,
          sourcePurchaseId: 1,
          reason: "test",
          createdAt: "2026-06-16T10:00:00.000Z",
          lines: [],
        } as PurchaseCorrection,
      ],
      productionBatches: [
        {
          id: 1,
          createdAt: "2026-06-01T10:00:00.000Z",
          occurredAt: "2026-06-16T10:00:00.000Z",
          totalCost: 80,
        } as ProductionBatch,
      ],
      salesInvoices: [
        {
          id: 1,
          createdAt: "2026-06-01T10:00:00.000Z",
          occurredAt: "2026-06-16T10:00:00.000Z",
          subtotal: 200,
          grossProfit: 80,
          totalCost: 120,
          paidAmount: 200,
          remainingAmount: 0,
        } as SalesInvoice,
      ],
    };

    const filtered = filterReportsDataByCreatedAt(
      data,
      { from: "2026-06-15", to: "2026-06-16" },
    );

    expect(filtered.buyers).toHaveLength(1);
    expect(filtered.suppliers).toHaveLength(1);
    expect(filtered.expenses.map((expense) => expense.id)).toEqual([1]);
    expect(filtered.ingredientPurchases.map((purchase) => purchase.id)).toEqual([1]);
    expect(filtered.purchaseCorrections.map((correction) => correction.id)).toEqual([1]);
    expect(filtered.productionBatches.map((batch) => batch.id)).toEqual([1]);
    expect(filtered.salesInvoices.map((invoice) => invoice.id)).toEqual([1]);
  });

  test("summarizes counts and financial totals from report rows", () => {
    const summary = summarizeReports({
      buyers: [{ id: 1 } as Buyer],
      suppliers: [{ id: 1 }, { id: 2 }] as never,
      ingredients: [],
      products: [
        { id: 1, stockQuantity: 2, averageUnitCost: 10 } as Product,
        { id: 2, stockQuantity: 3, averageUnitCost: 4 } as Product,
      ],
      expenses: [
        { id: 1, amount: 30 } as Expense,
        { id: 2, amount: 12 } as Expense,
      ],
      ingredientPurchases: [
        {
          id: 1,
          totalAmount: 150,
          paidAmount: 120,
          remainingAmount: 30,
          lines: [{ lineTotal: 100 }, { lineTotal: 50 }],
        } as IngredientPurchase,
      ],
      purchaseCorrections: [
        { id: 1, lines: [{ lineTotal: 15 }] } as PurchaseCorrection,
      ],
      productionBatches: [
        { id: 1, totalCost: 80, producedQuantity: 8 } as ProductionBatch,
      ],
      salesInvoices: [
        {
          id: 1,
          subtotal: 200,
          paidAmount: 125,
          remainingAmount: 75,
          totalCost: 120,
          grossProfit: 80,
        } as SalesInvoice,
      ],
    });

    expect(summary.peopleCount).toBe(3);
    expect(summary.currentProductStockValue).toBe(32);
    expect(summary.expensesTotal).toBe(42);
    expect(summary.ingredientPurchasesTotal).toBe(150);
    expect(summary.purchaseCorrectionsTotal).toBe(15);
    expect(summary.productionCostTotal).toBe(80);
    expect(summary.salesTotal).toBe(200);
    expect(summary.supplierDebtTotal).toBe(30);
    expect(summary.buyerDebtTotal).toBe(75);
    expect(summary.grossProfitTotal).toBe(80);
    expect(summary.netAfterExpenses).toBe(38);
  });
});
