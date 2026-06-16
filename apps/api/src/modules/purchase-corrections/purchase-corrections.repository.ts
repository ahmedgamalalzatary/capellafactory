import type {
  PurchaseCorrectionInput,
} from "@capella/shared/purchase-corrections/purchase-correction.types";
import { and, asc, eq, like, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  purchaseCorrectionLinesTable,
  purchaseCorrectionsTable,
  stockLayerAllocationsTable,
  stockLayersTable,
} from "../../db/schema/index.js";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import { recalculateIngredientBalances } from "../../services/stock-costing.service.js";
import { StockLedgerConflictError } from "../../utils/stock-ledger.js";
import {
  buildPurchaseCorrectionAllocationRow,
  getRemainingPurchaseCorrectionQuantity,
  resolvePurchaseCorrectionLineAmounts,
} from "./purchase-corrections.allocation.js";
import {
  assemblePurchaseCorrections,
  mapPurchaseCorrectionRowToPurchaseCorrection,
  normalizePurchaseCorrectionSearchQuery,
} from "./purchase-corrections.mappers.js";
import {
  PurchaseCorrectionValidationError,
  validatePurchaseCorrectionQuantity,
} from "./purchase-corrections.validators.js";

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

      const insertedCorrectionLines = await tx
        .select()
        .from(purchaseCorrectionLinesTable)
        .where(eq(purchaseCorrectionLinesTable.correctionId, createdId))
        .orderBy(asc(purchaseCorrectionLinesTable.id));

      const sourceLayerIdsByLineId = new Map<number, number>();
      for (const line of insertedCorrectionLines) {
        const sourceLayer = await tx.query.stockLayersTable.findFirst({
          where: and(
            eq(stockLayersTable.domain, "ingredient"),
            eq(stockLayersTable.sourceDocumentType, "ingredient-purchase"),
            eq(stockLayersTable.sourceLineId, line.sourcePurchaseLineId),
          ),
        });

        if (!sourceLayer) {
          throw new Error(`Missing stock layer for purchase line ${line.sourcePurchaseLineId}`);
        }

        sourceLayerIdsByLineId.set(line.id, sourceLayer.id);
      }

      await tx.insert(stockLayerAllocationsTable).values(
        insertedCorrectionLines.map((line) =>
          buildPurchaseCorrectionAllocationRow({
            correctionId: createdId,
            lineId: line.id,
            layerId: sourceLayerIdsByLineId.get(line.id) as number,
            ingredientId: line.ingredientId,
            normalizedQuantity: Number(line.normalizedQuantity),
            lineTotal: Number(line.lineTotal),
            occurredAt: new Date(),
          }),
        ),
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
