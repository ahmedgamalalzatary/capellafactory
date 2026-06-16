import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import type { Product } from "@capella/shared/products/product.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Expense } from "@capella/shared/expenses/expense.types";
import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { PurchaseCorrection } from "@capella/shared/purchase-corrections/purchase-correction.types";

// Tables that own row actions use the router; their child forms hit the api.
// Neither runs on a plain render, but the modules import at load time.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { BuyersTable } from "@/components/buyers/buyers-table";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import { ProductsTable } from "@/components/inventory/products-table";
import { IngredientsTable } from "@/components/inventory/ingredients-table";
import { ExpensesTable } from "@/components/purchases/expenses/expenses-table";
import { ProductionBatchesTable } from "@/components/production/production-batches-table";
import { IngredientPurchasesTable } from "@/components/purchases/ingredients/ingredient-purchases-table";
import { PurchaseCorrectionsTable } from "@/components/purchases/purchase-correction/purchase-corrections-table";

describe("BuyersTable", () => {
  const buyers: Buyer[] = [
    { id: 1, name: "مشتري واحد", phone: "0100", where: "القاهرة", notes: "vip" } as unknown as Buyer,
    { id: 2, name: "مشتري اثنان", phone: "0111", where: null, notes: null } as unknown as Buyer,
  ];

  test("renders a row per buyer (desktop + mobile both render the name)", () => {
    render(<BuyersTable buyers={buyers} />);
    // Name appears in both the desktop table and the mobile card.
    expect(screen.getAllByText("مشتري واحد").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("مشتري اثنان").length).toBeGreaterThanOrEqual(1);
    // Null where/notes fall back to an em dash.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  test("shows the empty state when there are no buyers", () => {
    render(<BuyersTable buyers={[]} />);
    expect(screen.getAllByText("لا يوجد مشترون بعد").length).toBeGreaterThan(0);
  });
});

describe("SuppliersTable", () => {
  const suppliers: Supplier[] = [
    { id: 1, name: "مورد ألف", phone: "0100", notes: "x" } as unknown as Supplier,
  ];

  test("renders the supplier name", () => {
    render(<SuppliersTable suppliers={suppliers} />);
    expect(screen.getAllByText("مورد ألف").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<SuppliersTable suppliers={[]} />);
    expect(screen.getAllByText(/لا يوجد موردون بعد|لا يوجد موردين بعد/).length).toBeGreaterThan(0);
  });
});

describe("ProductsTable", () => {
  const products: Product[] = [
    {
      id: 1,
      name: "كيك",
      stockQuantity: 12,
      averageUnitCost: 3.5,
      isArchived: false,
      hasHistory: true,
    } as unknown as Product,
    {
      id: 2,
      name: "بسكويت",
      stockQuantity: 0,
      averageUnitCost: 0,
      isArchived: true,
      hasHistory: false,
    } as unknown as Product,
  ];

  test("renders names, formatted stock, and status badges (active + archived)", () => {
    render(<ProductsTable products={products} />);
    expect(screen.getAllByText("كيك").length).toBeGreaterThan(0);
    expect(screen.getAllByText("بسكويت").length).toBeGreaterThan(0);
    // stockQuantity formatted to 3 decimals
    expect(screen.getAllByText("12.000").length).toBeGreaterThan(0);
    // both an active and an archived badge appear
    expect(screen.getAllByText("نشط").length).toBeGreaterThan(0);
    expect(screen.getAllByText("مؤرشف").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<ProductsTable products={[]} />);
    expect(screen.getAllByText("لا توجد منتجات بعد").length).toBeGreaterThan(0);
  });
});

describe("IngredientsTable", () => {
  const ingredients: Ingredient[] = [
    {
      id: 1,
      name: "دقيق",
      unitFamily: "weight",
      baseUnit: "g",
      stockQuantity: 5,
      isArchived: false,
      hasHistory: true,
    } as unknown as Ingredient,
    {
      id: 2,
      name: "حليب",
      unitFamily: "volume",
      baseUnit: "ml",
      stockQuantity: 2,
      isArchived: true,
      hasHistory: false,
    } as unknown as Ingredient,
    {
      id: 3,
      name: "بيض",
      unitFamily: "count",
      baseUnit: "pcs",
      stockQuantity: 30,
      isArchived: false,
      hasHistory: false,
    } as unknown as Ingredient,
  ];

  test("renders each family label (weight/volume/count)", () => {
    render(<IngredientsTable ingredients={ingredients} />);
    expect(screen.getAllByText("وزن").length).toBeGreaterThan(0);
    expect(screen.getAllByText("حجم").length).toBeGreaterThan(0);
    expect(screen.getAllByText("عدد").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<IngredientsTable ingredients={[]} />);
    expect(screen.getAllByText("لا توجد خامات بعد").length).toBeGreaterThan(0);
  });
});

describe("ExpensesTable", () => {
  const expenses: Expense[] = [
    {
      id: 1,
      type: "salary",
      employeeName: "أحمد",
      amount: 1500,
      occurredAt: "2026-05-01T08:00:00.000Z",
      notes: "راتب",
    } as unknown as Expense,
    {
      id: 2,
      type: "other",
      otherLabel: "كهرباء",
      amount: 300,
      occurredAt: "2026-05-02T08:00:00.000Z",
      notes: null,
    } as unknown as Expense,
    {
      id: 3,
      type: "rent",
      amount: 1000,
      occurredAt: "2026-05-03T08:00:00.000Z",
      notes: null,
    } as unknown as Expense,
  ];

  test("renders subtitles by type and formats the amount", () => {
    render(<ExpensesTable expenses={expenses} />);
    // salary -> employee name, other -> otherLabel, fallback -> generic label
    expect(screen.getAllByText("أحمد").length).toBeGreaterThan(0);
    expect(screen.getAllByText("كهرباء").length).toBeGreaterThan(0);
    expect(screen.getAllByText("مصروف عام").length).toBeGreaterThan(0);
    // amount formatted to 3 decimals
    expect(screen.getAllByText("1,500.000").length).toBeGreaterThan(0);
    // null notes -> "لا توجد"
    expect(screen.getAllByText("لا توجد").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<ExpensesTable expenses={[]} />);
    expect(screen.getAllByText("لا توجد مصروفات بعد").length).toBeGreaterThan(0);
  });
});

describe("ProductionBatchesTable", () => {
  const products: Product[] = [{ id: 5, name: "كيك" } as Product];
  const batches: ProductionBatch[] = [
    {
      id: 1,
      batchCode: "B-001",
      productId: 5,
      producedQuantity: 10,
      totalCost: 250,
      unitCost: 25,
      lines: [{ ingredientId: 11 }, { ingredientId: 12 }],
    } as unknown as ProductionBatch,
    {
      id: 2,
      batchCode: "B-002",
      productId: 99, // unknown product -> falls back to #id
      producedQuantity: 4,
      totalCost: 100,
      unitCost: 25,
      lines: [],
    } as unknown as ProductionBatch,
  ];

  test("maps productId to product name and falls back to #id when unknown", () => {
    render(<ProductionBatchesTable batches={batches} products={products} />);
    expect(screen.getAllByText("B-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("كيك").length).toBeGreaterThan(0);
    // unknown product id renders as "#99"
    expect(screen.getAllByText("#99").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<ProductionBatchesTable batches={[]} products={products} />);
    expect(screen.getAllByText("لا توجد تشغيلات إنتاج بعد").length).toBeGreaterThan(0);
  });
});

describe("IngredientPurchasesTable", () => {
  const purchases: IngredientPurchase[] = [
    {
      id: 1,
      invoiceCode: "INV-001",
      supplierName: "مورد ألف",
      supplierId: 3,
      occurredAt: "2026-05-01T08:00:00.000Z",
      lines: [{ lineTotal: 30 } as never, { lineTotal: 70 } as never],
    } as unknown as IngredientPurchase,
    {
      id: 2,
      invoiceCode: "INV-002",
      supplierName: null,
      supplierId: 9, // no name -> "مورد محفوظ #9"
      occurredAt: "2026-05-02T08:00:00.000Z",
      lines: [{ lineTotal: 50 } as never],
    } as unknown as IngredientPurchase,
  ];

  test("renders invoice codes, supplier-name fallback, and summed total", () => {
    render(<IngredientPurchasesTable purchases={purchases} />);
    expect(screen.getAllByText("INV-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("مورد ألف").length).toBeGreaterThan(0);
    // missing supplierName but present id -> saved-supplier fallback label
    expect(screen.getAllByText("مورد محفوظ #9").length).toBeGreaterThan(0);
    // 30 + 70 = 100.000
    expect(screen.getAllByText("100.000").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<IngredientPurchasesTable purchases={[]} />);
    expect(screen.getAllByText("لا توجد فواتير شراء خامات بعد").length).toBeGreaterThan(0);
  });
});

describe("PurchaseCorrectionsTable", () => {
  const corrections: PurchaseCorrection[] = [
    {
      id: 1,
      sourcePurchaseInvoiceCode: "INV-001",
      sourcePurchaseId: 1,
      reason: "تالف",
      createdAt: "2026-05-01T08:00:00.000Z",
      lines: [{ lineTotal: 20 } as never, { lineTotal: 5 } as never],
    } as unknown as PurchaseCorrection,
    {
      id: 2,
      sourcePurchaseInvoiceCode: null, // -> "فاتورة #7"
      sourcePurchaseId: 7,
      reason: "خطأ كمية",
      createdAt: "2026-05-02T08:00:00.000Z",
      lines: [{ lineTotal: 10 } as never],
    } as unknown as PurchaseCorrection,
  ];

  test("renders the source invoice with #id fallback and the reason", () => {
    render(<PurchaseCorrectionsTable corrections={corrections} />);
    expect(screen.getAllByText("INV-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("فاتورة #7").length).toBeGreaterThan(0);
    expect(screen.getAllByText("تالف").length).toBeGreaterThan(0);
    // 20 + 5 = 25.000
    expect(screen.getAllByText("25.000").length).toBeGreaterThan(0);
  });

  test("shows the empty state", () => {
    render(<PurchaseCorrectionsTable corrections={[]} />);
    expect(screen.getAllByText("لا توجد عمليات عكس شراء بعد").length).toBeGreaterThan(0);
  });
});
