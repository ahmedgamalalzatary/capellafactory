import type {
  ProductionBatch,
  ProductionBatchIngredientLine,
} from "@capella/shared/production-batches/production-batch.types";

export type ProductionBatchRow = {
  id: number;
  batchCode: string;
  occurredAt: Date | string;
  productId: number;
  producedQuantity: string | number;
  totalCost: string | number;
  unitCost: string | number;
  notes: string | null;
  createdAt: Date | string;
};

export type ProductionBatchLineRow = {
  id: number;
  ingredientId: number;
  quantity: string | number;
  unit: ProductionBatchIngredientLine["unit"];
  normalizedQuantity: string | number;
  unitCost: string | number;
  lineCost: string | number;
};

export function mapProductionBatchLineRow(
  row: ProductionBatchLineRow,
): ProductionBatchIngredientLine {
  return {
    id: row.id,
    ingredientId: row.ingredientId,
    quantity: Number(row.quantity),
    unit: row.unit,
    normalizedQuantity: Number(row.normalizedQuantity),
    unitCost: Number(row.unitCost),
    lineCost: Number(row.lineCost),
  };
}

export function mapProductionBatchRowToProductionBatch(
  row: ProductionBatchRow,
  lines: ProductionBatchLineRow[],
): ProductionBatch {
  return {
    id: row.id,
    batchCode: row.batchCode,
    occurredAt: toIsoString(row.occurredAt),
    productId: row.productId,
    producedQuantity: Number(row.producedQuantity),
    totalCost: Number(row.totalCost),
    unitCost: Number(row.unitCost),
    ...(row.notes ? { notes: row.notes } : {}),
    createdAt: toIsoString(row.createdAt),
    lines: lines.map(mapProductionBatchLineRow),
  };
}

export function normalizeProductionBatchSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export function compareProductionBatchListOrder(
  left: Pick<ProductionBatch, "id" | "createdAt">,
  right: Pick<ProductionBatch, "id" | "createdAt">,
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
