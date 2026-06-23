import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Product } from "@capella/shared/products/product.types";
import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { SalesInvoice } from "@capella/shared/sales-invoices/sales-invoice.types";

import { ReportsWorkspace } from "@/components/reports/reports-workspace";

vi.mock("@/components/reports/report-pdf-download-button", () => ({
  ReportPdfDownloadButton: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

const baseData = {
  buyers: [
    {
      id: 7,
      name: "شركة النيل",
      phone: "0100",
      where: "القاهرة",
      notes: "عميل نقدي",
      createdAt: "2026-06-15T08:00:00.000Z",
      updatedAt: "2026-06-02T08:00:00.000Z",
    } as Buyer,
  ],
  suppliers: [],
  ingredients: [
    {
      id: 3,
      name: "دقيق",
      unitFamily: "weight",
      baseUnit: "g",
      stockQuantity: 25,
      hasHistory: true,
      isArchived: false,
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-02T08:00:00.000Z",
    } as Ingredient,
  ],
  products: [
    {
      id: 5,
      name: "كيك",
      stockQuantity: 8,
      averageUnitCost: 11.5,
      hasHistory: true,
      isArchived: false,
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-02T08:00:00.000Z",
    } as Product,
  ],
  expenses: [],
  ingredientPurchases: [],
  purchaseCorrections: [],
  productionBatches: [
    {
      id: 4,
      batchCode: "B-004",
      productId: 5,
      occurredAt: "2026-06-04T08:00:00.000Z",
      producedQuantity: 12,
      totalCost: 180,
      unitCost: 15,
      createdAt: "2026-06-15T08:00:00.000Z",
      lines: [
        { id: 1, ingredientId: 3, quantity: 2, unit: "kg" },
        { id: 2, ingredientId: 9, quantity: 1, unit: "L" },
      ],
    } as ProductionBatch,
  ],
  salesInvoices: [
    {
      id: 2,
      invoiceCode: "SAL-002",
      buyerId: 7,
      occurredAt: "2026-06-03T08:00:00.000Z",
      createdAt: "2026-06-15T08:00:00.000Z",
      baseTotal: 120,
      taxState: "inactive",
      taxValue: 0,
      taxAmount: 0,
      totalAfterTax: 120,
      discountState: "inactive",
      discountValue: 0,
      discountAmount: 0,
      finalTotal: 120,
      subtotal: 120,
      totalCost: 70,
      grossProfit: 50,
      lines: [{ id: 1, productId: 5, quantity: 2 }],
      paidAmount: 100,
      remainingAmount: 20,
      paymentStatus: "partial",
    } as SalesInvoice,
    {
      id: 3,
      invoiceCode: "SAL-003",
      buyerId: 7,
      occurredAt: "2026-06-03T08:00:00.000Z",
      createdAt: "2026-06-15T08:00:00.000Z",
      baseTotal: 50,
      taxState: "inactive",
      taxValue: 0,
      taxAmount: 0,
      totalAfterTax: 50,
      discountState: "inactive",
      discountValue: 0,
      discountAmount: 0,
      finalTotal: 50,
      subtotal: 50,
      paidAmount: 50,
      remainingAmount: 0,
      totalCost: 30,
      grossProfit: 20,
      lines: [],
      paymentStatus: "paid",
    } as SalesInvoice,
  ],
};

describe("ReportsWorkspace", () => {
  test("renders approved report tabs and a pdf download for the active tab", () => {
    render(<ReportsWorkspace data={baseData} activeTab="overview" />);

    expect(screen.getByRole("link", { name: "نظرة عامة" })).toHaveAttribute(
      "href",
      "/reports?tab=overview",
    );
    expect(screen.getByRole("link", { name: "المبيعات" })).toHaveAttribute(
      "href",
      "/reports?tab=sales",
    );
    expect(screen.queryByRole("link", { name: "المشترون" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "الموردون" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "الخامات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "المنتجات" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("من تاريخ")).toHaveValue("");
    expect(screen.getByLabelText("إلى تاريخ")).toHaveValue("");
    expect(screen.queryByRole("link", { name: "آخر 7 أيام" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "آخر 30 يوم" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "آخر يوم" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "كل الوقت" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تحميل PDF" })).toBeInTheDocument();
  });

  test("preserves the selected custom date range when switching report tabs", () => {
    render(
      <ReportsWorkspace
        data={baseData}
        activeTab="sales"
        activeFrom="2026-06-01"
        activeTo="2026-06-21"
      />,
    );

    expect(screen.getByRole("link", { name: "فواتير الخامات" })).toHaveAttribute(
      "href",
      "/reports?tab=ingredient-purchases&from=2026-06-01&to=2026-06-21",
    );
  });

  test("renders the custom date form and preserves dates when switching report tabs", () => {
    render(
      <ReportsWorkspace
        data={baseData}
        activeTab="sales"
        activeFrom="2026-06-01"
        activeTo="2026-06-21"
      />,
    );

    expect(screen.getByRole("link", { name: "فواتير الخامات" })).toHaveAttribute(
      "href",
      "/reports?tab=ingredient-purchases&from=2026-06-01&to=2026-06-21",
    );
    expect(screen.getByLabelText("من تاريخ")).toHaveValue("2026-06-01");
    expect(screen.getByLabelText("إلى تاريخ")).toHaveValue("2026-06-21");
    expect(screen.getByRole("button", { name: "تطبيق" })).toBeInTheDocument();
  });

  test("links transaction rows to their existing detail routes", () => {
    render(<ReportsWorkspace data={baseData} activeTab="sales" />);

    expect(screen.getByText("SAL-002")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "عرض SAL-002" })).toHaveAttribute(
      "href",
      "/sales/2",
    );
  });

  test("production-batch reports point to the full recipe detail page", () => {
    render(<ReportsWorkspace data={baseData} activeTab="production-batches" />);

    expect(screen.getByText("B-004")).toBeInTheDocument();
    expect(screen.getByText("2 خامات")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "عرض الوصفة B-004" })).toHaveAttribute(
      "href",
      "/products/production-batches/4",
    );
  });

  test("buyer debt report shows only invoices with remaining amount", () => {
    render(<ReportsWorkspace data={baseData} activeTab="buyer-debts" />);

    expect(screen.getByText("SAL-002")).toBeInTheDocument();
    expect(screen.queryByText("SAL-003")).not.toBeInTheDocument();
    expect(screen.getByText("20.000")).toBeInTheDocument();
  });

  test("supplier debt report shows only purchases with remaining amount", () => {
    render(
      <ReportsWorkspace
        data={{
          ...baseData,
          ingredientPurchases: [
            {
              id: 10,
              invoiceCode: "PUR-010",
              supplierId: 9,
              supplierName: "مورد الدلتا",
              occurredAt: "2026-06-03T08:00:00.000Z",
              createdAt: "2026-06-03T08:00:00.000Z",
              baseTotal: 100,
              taxState: "inactive",
              taxValue: 0,
              taxAmount: 0,
              totalAfterTax: 100,
              discountState: "inactive",
              discountValue: 0,
              discountAmount: 0,
              finalTotal: 100,
              totalAmount: 100,
              paidAmount: 70,
              remainingAmount: 30,
              paymentStatus: "partial",
              payments: [],
              lines: [],
            } as IngredientPurchase,
            {
              id: 11,
              invoiceCode: "PUR-011",
              occurredAt: "2026-06-03T08:00:00.000Z",
              createdAt: "2026-06-03T08:00:00.000Z",
              baseTotal: 20,
              taxState: "inactive",
              taxValue: 0,
              taxAmount: 0,
              totalAfterTax: 20,
              discountState: "inactive",
              discountValue: 0,
              discountAmount: 0,
              finalTotal: 20,
              totalAmount: 20,
              paidAmount: 20,
              remainingAmount: 0,
              paymentStatus: "paid",
              payments: [],
              lines: [],
            } as IngredientPurchase,
          ],
        }}
        activeTab="supplier-debts"
      />,
    );

    expect(screen.getByText("PUR-010")).toBeInTheDocument();
    expect(screen.queryByText("PUR-011")).not.toBeInTheDocument();
    expect(screen.getByText("30.000")).toBeInTheDocument();
  });
});
