import type {
  PurchaseCorrection,
  PurchaseCorrectionInput,
  PurchaseCorrectionLine,
} from "@capella/shared/purchase-corrections/purchase-correction.types";
import { and, asc, eq, like, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  purchaseCorrectionLinesTable,
  purchaseCorrectionsTable,
} from "../../db/schema/index.js";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import { recalculateIngredientBalances } from "../../services/stock-costing.service.js";
import { StockLedgerConflictError } from "../../utils/stock-ledger.js";

export class PurchaseCorrectionValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

type PurchaseCorrectionRow = {
  id: number;
  sourcePurchaseId: number;
  sourcePurchaseInvoiceCode?: string | null;
  reason: string;
  createdAt: Date | string;
};

type PurchaseCorrectionLineRow = {
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

export function resolvePurchaseCorrectionLineAmounts(input: {
  sourceQuantity: number;
  sourceLineTotal: number;
  correctionQuantity: number;
}) {
  if (input.sourceQuantity === 0) {
    throw new PurchaseCorrectionValidationError(
      "Source purchase line quantity must be greater than zero",
    );
  }

  const unitPrice = input.sourceLineTotal / input.sourceQuantity;

  return {
    unitPrice,
    lineTotal: unitPrice * input.correctionQuantity,
  };
}

export function getRemainingPurchaseCorrectionQuantity(
  sourceQuantity: number,
  previouslyCorrectedQuantity: number,
) {
  return sourceQuantity - previouslyCorrectedQuantity;
}

export function validatePurchaseCorrectionQuantity(input: {
  ingredientName: string;
  requestedQuantity: number;
  remainingQuantity: number;
}) {
  if (input.requestedQuantity > input.remainingQuantity) {
    throw new PurchaseCorrectionValidationError(
      `Correction quantity exceeds remaining reversible quantity for ${input.ingredientName}`,
    );
  }
}

export async function listPurchaseCorrections(query?: string) {
  const normalizedQuery = normalizePurchaseCorrectionSearchQuery(query);
  const rows = await db
    .select({
      id: purchaseCorrectionsTable.id,
      sourcePurchaseId: purchaseCorrectionsTable.sourcePurchaseId,
      sourcePurchaseInvoiceCode: ingredientPurchasesTable.invoiceCode,
      reason: purchaseCorrectionsTable.reason,
      createdAt: purchaseCorrectionsTable.createdAt,
    })
    .from(purchaseCorrectionsTable)
    .innerJoin(
      ingredientPurchasesTable,
      eq(purchaseCorrectionsTable.sourcePurchaseId, ingredientPurchasesTable.id),
    )
    .where(
      and(
        normalizedQuery
          ? or(
              like(purchaseCorrectionsTable.reason, `%${normalizedQuery}%`),
              like(ingredientPurchasesTable.invoiceCode, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(purchaseCorrectionsTable.createdAt), asc(purchaseCorrectionsTable.id));

  if (!rows.length) {
    return [];
  }

  const correctionIds = rows.map((row) => row.id);
  const lines = await db
    .select()
    .from(purchaseCorrectionLinesTable)
    .where(or(...correctionIds.map((id) => eq(purchaseCorrectionLinesTable.correctionId, id))))
    .orderBy(asc(purchaseCorrectionLinesTable.correctionId), asc(purchaseCorrectionLinesTable.id));

  return assemblePurchaseCorrections(rows, lines);
}

export async function getPurchaseCorrectionById(id: number) {
  const row = await db
    .select({
      id: purchaseCorrectionsTable.id,
      sourcePurchaseId: purchaseCorrectionsTable.sourcePurchaseId,
      sourcePurchaseInvoiceCode: ingredientPurchasesTable.invoiceCode,
      reason: purchaseCorrectionsTable.reason,
      createdAt: purchaseCorrectionsTable.createdAt,
    })
    .from(purchaseCorrectionsTable)
    .innerJoin(
      ingredientPurchasesTable,
      eq(purchaseCorrectionsTable.sourcePurchaseId, ingredientPurchasesTable.id),
    )
    .where(eq(purchaseCorrectionsTable.id, id))
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return null;
  }

  const lines = await db
    .select()
    .from(purchaseCorrectionLinesTable)
    .where(eq(purchaseCorrectionLinesTable.correctionId, id))
    .orderBy(asc(purchaseCorrectionLinesTable.id));

  return mapPurchaseCorrectionRowToPurchaseCorrection(row, lines);
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

export async function createPurchaseCorrection(input: PurchaseCorrectionInput) {
  const sourcePurchase = await db.query.ingredientPurchasesTable.findFirst({
    where: eq(ingredientPurchasesTable.id, input.sourcePurchaseId),
  });

  if (!sourcePurchase) {
    throw new PurchaseCorrectionValidationError("Source purchase not found");
  }

  const uniqueSourceLineIds = [...new Set(input.lines.map((line) => line.sourcePurchaseLineId))];
  const sourceLines = await db
    .select()
    .from(ingredientPurchaseLinesTable)
    .where(
      or(...uniqueSourceLineIds.map((id) => eq(ingredientPurchaseLinesTable.id, id))),
    );

  const sourceLinesById = new Map(
    sourceLines.map((line) => [line.id, line]),
  );

  for (const line of input.lines) {
    const sourceLine = sourceLinesById.get(line.sourcePurchaseLineId);
    if (!sourceLine || sourceLine.purchaseId !== input.sourcePurchaseId) {
      throw new PurchaseCorrectionValidationError("Correction lines must belong to the source purchase");
    }
  }

  const priorCorrectionLines = uniqueSourceLineIds.length
    ? await db
        .select()
        .from(purchaseCorrectionLinesTable)
        .where(
          or(...uniqueSourceLineIds.map((id) => eq(purchaseCorrectionLinesTable.sourcePurchaseLineId, id))),
        )
    : [];

  const correctedQuantityBySourceLineId = new Map<number, number>();
  for (const line of priorCorrectionLines) {
    correctedQuantityBySourceLineId.set(
      line.sourcePurchaseLineId,
      (correctedQuantityBySourceLineId.get(line.sourcePurchaseLineId) ?? 0) + Number(line.quantity),
    );
  }

  const preparedLines = input.lines.map((line) => {
    const sourceLine = sourceLinesById.get(line.sourcePurchaseLineId);
    if (!sourceLine) {
      throw new PurchaseCorrectionValidationError("One or more source purchase lines were not found");
    }

    const remainingQuantity = getRemainingPurchaseCorrectionQuantity(
      Number(sourceLine.quantity),
      correctedQuantityBySourceLineId.get(sourceLine.id) ?? 0,
    );

    validatePurchaseCorrectionQuantity({
      ingredientName: `ingredient #${sourceLine.ingredientId}`,
      requestedQuantity: line.quantity,
      remainingQuantity,
    });

    const amounts = resolvePurchaseCorrectionLineAmounts({
      sourceQuantity: Number(sourceLine.quantity),
      sourceLineTotal: Number(sourceLine.lineTotal),
      correctionQuantity: line.quantity,
    });

    const normalizedQuantity = normalizeIngredientQuantity(
      sourceLine.unit === "kg" || sourceLine.unit === "g"
        ? "weight"
        : sourceLine.unit === "L" || sourceLine.unit === "ml"
          ? "volume"
          : "count",
      line.quantity,
      sourceLine.unit,
    );

    return {
      sourceLine,
      quantity: line.quantity,
      normalizedQuantity,
      unitPrice: amounts.unitPrice,
      lineTotal: amounts.lineTotal,
    };
  });

  try {
    const correctionId = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(purchaseCorrectionsTable)
        .values({
          sourcePurchaseId: input.sourcePurchaseId,
          reason: input.reason,
        })
        .$returningId();

      const createdId = inserted[0]?.id;
      if (!createdId) {
        throw new Error("Failed to create purchase correction");
      }

      await tx.insert(purchaseCorrectionLinesTable).values(
        preparedLines.map((line) => ({
          correctionId: createdId,
          sourcePurchaseLineId: line.sourceLine.id,
          ingredientId: line.sourceLine.ingredientId,
          quantity: line.quantity.toFixed(3),
          unit: line.sourceLine.unit,
          unitPrice: line.unitPrice.toFixed(3),
          lineTotal: line.lineTotal.toFixed(3),
          normalizedQuantity: line.normalizedQuantity.toFixed(3),
        })),
      );

      await recalculateIngredientBalances(tx);

      return createdId;
    });

    const correction = await getPurchaseCorrectionById(correctionId);
    if (!correction) {
      throw new Error(`Failed to load created purchase correction with id ${correctionId}`);
    }

    return correction;
  } catch (error) {
    if (error instanceof StockLedgerConflictError) {
      throw new PurchaseCorrectionValidationError(
        "Saving this correction would make ingredient stock negative",
      );
    }

    throw error;
  }
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
