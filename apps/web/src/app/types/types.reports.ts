import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Expense } from "@capella/shared/expenses/expense.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Product } from "@capella/shared/products/product.types";
import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { PurchaseCorrection } from "@capella/shared/purchase-corrections/purchase-correction.types";
import type { SalesInvoice } from "@capella/shared/sales-invoices/sales-invoice.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";

export type ReportsTabKey =
  | "overview"
  | "expenses"
  | "ingredient-purchases"
  | "purchase-corrections"
  | "production-batches"
  | "sales"
  | "supplier-debts"
  | "buyer-debts";

export type ReportsRangeKey = "all" | "last-day" | "last-7-days" | "last-30-days";

export type ReportsData = {
  buyers: Buyer[];
  suppliers: Supplier[];
  ingredients: Ingredient[];
  products: Product[];
  expenses: Expense[];
  ingredientPurchases: IngredientPurchase[];
  purchaseCorrections: PurchaseCorrection[];
  productionBatches: ProductionBatch[];
  salesInvoices: SalesInvoice[];
};

export type ReportsPageProps = {
  searchParams?: Promise<{
    tab?: string;
    range?: string;
  }>;
};
