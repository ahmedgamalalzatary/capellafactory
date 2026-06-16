import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
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
      subtotal: 120,
      totalCost: 70,
      grossProfit: 50,
      lines: [{ id: 1, productId: 5, quantity: 2 }],
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
    expect(screen.getByRole("link", { name: "آخر 7 أيام" })).toHaveAttribute(
      "href",
      "/reports?tab=overview&range=last-7-days",
    );
    expect(screen.getByRole("button", { name: "تحميل PDF" })).toBeInTheDocument();
  });

  test("preserves the selected date range when switching report tabs", () => {
    render(<ReportsWorkspace data={baseData} activeTab="sales" activeRange="last-30-days" />);

    expect(screen.getByRole("link", { name: "فواتير الخامات" })).toHaveAttribute(
      "href",
      "/reports?tab=ingredient-purchases&range=last-30-days",
    );
    expect(screen.getByRole("link", { name: "آخر 30 يوم" })).toHaveAttribute(
      "href",
      "/reports?tab=sales&range=last-30-days",
    );
  });

  test("opens full master-data details in a read-only dialog", async () => {
    render(<ReportsWorkspace data={baseData} activeTab="buyers" />);

    await userEvent.click(screen.getByRole("button", { name: "عرض شركة النيل" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("تفاصيل المشتري")).toBeInTheDocument();
    expect(within(dialog).getByText("0100")).toBeInTheDocument();
    expect(within(dialog).getByText("عميل نقدي")).toBeInTheDocument();
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
});
