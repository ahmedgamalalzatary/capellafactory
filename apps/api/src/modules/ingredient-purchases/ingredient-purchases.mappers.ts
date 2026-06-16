import type {
  IngredientPurchase,
  IngredientPurchaseLine,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";

export type IngredientPurchaseRow = {
  id: number;
  invoiceCode: string;
  occurredAt: Date | string;
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
): IngredientPurchase {
  return {
    id: row.id,
    invoiceCode: row.invoiceCode,
    occurredAt: toIsoString(row.occurredAt),
    ...(row.supplierId ? { supplierId: row.supplierId } : {}),
    ...(row.supplierName ? { supplierName: row.supplierName } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    createdAt: toIsoString(row.createdAt),
    lines: lines.map(mapIngredientPurchaseLineRow),
  };
}

export function normalizeIngredientPurchaseSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
