import type {
  PurchaseCorrection,
  PurchaseCorrectionLine,
} from "@capella/shared/purchase-corrections/purchase-correction.types";

export type PurchaseCorrectionRow = {
  id: number;
  sourcePurchaseId: number;
  sourcePurchaseInvoiceCode?: string | null;
  reason: string;
  createdAt: Date | string;
};

export type PurchaseCorrectionLineRow = {
  correctionId?: number;
  id: number;
  sourcePurchaseLineId: number;
  ingredientId: number;
  quantity: string | number;
  unit: PurchaseCorrectionLine["unit"];
  unitPrice: string | number;
  lineTotal: string | number;
  normalizedQuantity: string | number;
};

export function mapPurchaseCorrectionLineRow(row: PurchaseCorrectionLineRow): PurchaseCorrectionLine {
  return {
    id: row.id,
    sourcePurchaseLineId: row.sourcePurchaseLineId,
    ingredientId: row.ingredientId,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unitPrice),
    lineTotal: Number(row.lineTotal),
    normalizedQuantity: Number(row.normalizedQuantity),
  };
}

export function mapPurchaseCorrectionRowToPurchaseCorrection(
  row: PurchaseCorrectionRow,
  lines: PurchaseCorrectionLineRow[],
): PurchaseCorrection {
  return {
    id: row.id,
    sourcePurchaseId: row.sourcePurchaseId,
    ...(row.sourcePurchaseInvoiceCode
      ? { sourcePurchaseInvoiceCode: row.sourcePurchaseInvoiceCode }
      : {}),
    reason: row.reason,
    createdAt: toIsoString(row.createdAt),
    lines: lines.map(mapPurchaseCorrectionLineRow),
  };
}

export function normalizePurchaseCorrectionSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export function assemblePurchaseCorrections(
  rows: PurchaseCorrectionRow[],
  lines: PurchaseCorrectionLineRow[],
): PurchaseCorrection[] {
  const linesByCorrectionId = new Map<number, PurchaseCorrectionLineRow[]>();

  for (const line of lines) {
    if (typeof line.correctionId !== "number") {
      continue;
    }

    const groupedLines = linesByCorrectionId.get(line.correctionId) ?? [];
    groupedLines.push(line);
    linesByCorrectionId.set(line.correctionId, groupedLines);
  }

  return rows.map((row) =>
    mapPurchaseCorrectionRowToPurchaseCorrection(row, linesByCorrectionId.get(row.id) ?? []),
  );
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
