import type {
  IngredientPurchase,
  IngredientPurchaseLine,
  IngredientPurchasePayment,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { PaymentMethod } from "@capella/shared/payments/payment.types";
import { createPaymentSummary } from "@capella/shared/payments/payment.schema";

export type IngredientPurchaseRow = {
  id: number;
  invoiceCode: string;
  occurredAt: Date | string;
  totalAmount: string | number;
  supplierId: number | null;
  supplierName: string | null;
  notes: string | null;
  createdAt: Date | string;
};

export type IngredientPurchaseLineRow = {
  id: number;
  ingredientId: number;
  quantity: string | number;
  unit: IngredientPurchaseLine["unit"];
  unitPrice: string | number;
  lineTotal: string | number;
  normalizedQuantity: string | number;
};

export type IngredientPurchasePaymentTotalRow = {
  purchaseId: number;
  paidAmount: string | null;
};

export type IngredientPurchasePaymentRow = {
  id: number;
  amount: string | number;
  paymentMethod: PaymentMethod;
  paidAt: Date | string;
};

export function createIngredientPurchasePaymentTotalLookup(
  rows: IngredientPurchasePaymentTotalRow[],
) {
  return new Map(rows.map((row) => [row.purchaseId, row.paidAmount ? Number(row.paidAmount) : 0]));
}

function mapIngredientPurchasePaymentRow(
  row: IngredientPurchasePaymentRow,
): IngredientPurchasePayment {
  return {
    id: row.id,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    paidAt: toIsoString(row.paidAt),
  };
}

export function mapIngredientPurchaseLineRow(row: IngredientPurchaseLineRow): IngredientPurchaseLine {
  return {
    id: row.id,
    ingredientId: row.ingredientId,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unitPrice),
    lineTotal: Number(row.lineTotal),
    normalizedQuantity: Number(row.normalizedQuantity),
  };
}

export function mapIngredientPurchaseRowToIngredientPurchase(
  row: IngredientPurchaseRow,
  lines: IngredientPurchaseLineRow[],
  paidAmount = Number(row.totalAmount),
  payments: IngredientPurchasePaymentRow[] = [],
): IngredientPurchase {
  const totalAmount = Number(row.totalAmount);
  const summary = createPaymentSummary({ totalAmount, paidAmount });

  return {
    id: row.id,
    invoiceCode: row.invoiceCode,
    occurredAt: toIsoString(row.occurredAt),
    totalAmount,
    paidAmount: summary.paidAmount,
    remainingAmount: summary.remainingAmount,
    paymentStatus: summary.paymentStatus,
    ...(row.supplierId ? { supplierId: row.supplierId } : {}),
    ...(row.supplierName ? { supplierName: row.supplierName } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    createdAt: toIsoString(row.createdAt),
    payments: payments.map(mapIngredientPurchasePaymentRow),
    lines: lines.map(mapIngredientPurchaseLineRow),
  };
}

export function normalizeIngredientPurchaseSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export function compareIngredientPurchaseListOrder(
  left: Pick<IngredientPurchase, "id" | "createdAt">,
  right: Pick<IngredientPurchase, "id" | "createdAt">,
) {
  const leftTime = new Date(left.createdAt).getTime();
  const rightTime = new Date(right.createdAt).getTime();

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.id - left.id;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
