import type { ProductionBatchInput } from "@capella/shared/production-batches/production-batch.types";
import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import { escapeLike } from "../../utils/search.js";
import { db } from "../../db/index.js";
import {
  ingredientsTable,
  productionBatchLinesTable,
  productionBatchesTable,
  productsTable,
  stockLayerAllocationsTable,
  stockLayersTable,
} from "../../db/schema/index.js";
import { buildProductionBatchCode } from "../../services/invoice-code.service.js";
import { recalculateStockBalances } from "../../services/stock-costing.service.js";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import { StockLedgerConflictError } from "../../utils/stock-ledger.js";
import {
  allocateProductionBatchLineFromLayers,
  buildProductionBatchOutputLayer,
} from "./production-batches.allocation.js";
import {
  assembleProductionBatches,
  compareProductionBatchListOrder,
  mapProductionBatchRowToProductionBatch,
  normalizeProductionBatchSearchQuery,
} from "./production-batches.mappers.js";
import {
  ProductionBatchValidationError,
  validateProductionBatchLineUnit,
  validateProductionBatchStock,
} from "./production-batches.validators.js";

export async function listProductionBatches(query?: string) {
  const normalizedQuery = normalizeProductionBatchSearchQuery(query);
  const rows = await db
    .select()
    .from(productionBatchesTable)
    .where(
      and(
        normalizedQuery
          ? or(
            like(productionBatchesTable.batchCode, `%${escapeLike(normalizedQuery)}%`),
            like(productionBatchesTable.notes, `%${escapeLike(normalizedQuery)}%`),
          )
          : undefined,
      ),
    )
    .orderBy(asc(productionBatchesTable.occurredAt), asc(productionBatchesTable.id));

  if (rows.length === 0) {
    return [];
  }

  const lines = await db
    .select()
    .from(productionBatchLinesTable)
    .where(inArray(productionBatchLinesTable.batchId, rows.map((row) => row.id)))
    .orderBy(asc(productionBatchLinesTable.batchId), asc(productionBatchLinesTable.id));

  return assembleProductionBatches(rows, lines).sort(compareProductionBatchListOrder);
}

export async function getProductionBatchById(id: number) {
  const row = await db.query.productionBatchesTable.findFirst({
    where: eq(productionBatchesTable.id, id),
  });

  if (!row) {
    return null;
  }

  const lines = await db
    .select()
    .from(productionBatchLinesTable)
    .where(eq(productionBatchLinesTable.batchId, id))
    .orderBy(asc(productionBatchLinesTable.id));

  return mapProductionBatchRowToProductionBatch(row, lines);
}

export async function createProductionBatch(input: ProductionBatchInput) {
  const relationState = await validateProductionBatchRelations(input);
  const preparedLines = input.lines.map((line) => {
    const ingredient = relationState.ingredientsById.get(line.ingredientId);

    if (!ingredient) {
      throw new ProductionBatchValidationError("خامة واحدة أو أكثر غير موجودة");
    }

    validateProductionBatchLineUnit(ingredient.unitFamily, line.unit);
    const normalizedQuantity = normalizeIngredientQuantity(
      ingredient.unitFamily,
      line.quantity,
      line.unit,
    );

    return {
      ...line,
      normalizedQuantity,
      availableQuantity: Number(ingredient.stockQuantity),
      ingredientName: ingredient.name,
    };
  });

  validateProductionBatchStock(
    preparedLines.map((line) => ({
      ingredientId: line.ingredientId,
      ingredientName: line.ingredientName,
      requestedQuantity: line.normalizedQuantity,
      availableQuantity: line.availableQuantity,
    })),
  );

  if (input.producedQuantity <= 0) {
    throw new ProductionBatchValidationError("كمية الإنتاج يجب أن تكون أكبر من صفر");
  }

  const insertedId = await createProductionBatchTransaction(input, preparedLines);

  const batch = await getProductionBatchById(insertedId);

  if (!batch) {
    throw new Error(`تعذر تحميل المنتج الذي تم إنشاؤهion batch with id ${insertedId}`);
  }

  return batch;
}

type PreparedProductionLine = ProductionBatchInput["lines"][number] & {
  normalizedQuantity: number;
  availableQuantity: number;
  ingredientName: string;
};

async function createProductionBatchTransaction(
  input: ProductionBatchInput,
  preparedLines: PreparedProductionLine[],
) {
  try {
    return await db.transaction(async (tx) => {
      const occurredAt = new Date(input.occurredAt);
      const inserted = await tx
        .insert(productionBatchesTable)
        .values({
          batchCode: "",
          occurredAt,
          productId: input.productId,
          producedQuantity: input.producedQuantity.toFixed(3),
          totalCost: "0.000",
          unitCost: "0.000000",
          notes: input.notes,
        })
        .$returningId();

      const batchId = inserted[0]?.id;

      if (!batchId) {
        throw new Error("تعذر إنشاء التشغيلة");
      }

      await tx
        .update(productionBatchesTable)
        .set({ batchCode: buildProductionBatchCode(occurredAt, batchId) })
        .where(eq(productionBatchesTable.id, batchId));

      await tx.insert(productionBatchLinesTable).values(
        preparedLines.map((line) => ({
          batchId,
          ingredientId: line.ingredientId,
          quantity: line.quantity.toFixed(3),
          unit: line.unit,
          normalizedQuantity: line.normalizedQuantity.toFixed(3),
          unitCost: "0.000000",
          lineCost: "0.000",
        })),
      );

      const insertedLines = await tx
        .select()
        .from(productionBatchLinesTable)
        .where(eq(productionBatchLinesTable.batchId, batchId))
        .orderBy(asc(productionBatchLinesTable.id));

      let totalCost = 0;

      for (const line of insertedLines) {
        const openLayers = await tx
          .select()
          .from(stockLayersTable)
          .where(and(eq(stockLayersTable.domain, "ingredient"), eq(stockLayersTable.itemId, line.ingredientId)))
          .orderBy(asc(stockLayersTable.occurredAt), asc(stockLayersTable.id));

        const allocationResult = allocateProductionBatchLineFromLayers(
          {
            ingredientId: line.ingredientId,
            batchId,
            batchLineId: line.id,
            normalizedQuantity: Number(line.normalizedQuantity),
            occurredAt,
          },
          openLayers.map((layer) => ({
            id: layer.id,
            sourceLineId: layer.sourceLineId,
            remainingQuantity: Number(layer.remainingQuantity),
            unitCost: Number(layer.unitCost),
          })),
        );

        const allocatedQuantity = allocationResult.allocations.reduce(
          (sum, allocation) => sum + Number(allocation.allocatedQuantity),
          0,
        );

        if (allocatedQuantity < Number(line.normalizedQuantity)) {
          throw new StockLedgerConflictError(
            line.ingredientId,
            `Insufficient ingredient stock in chronological history for ingredient ${line.ingredientId}`,
          );
        }

        await tx.insert(stockLayerAllocationsTable).values(allocationResult.allocations);

        for (const allocation of allocationResult.allocations) {
          const layer = openLayers.find((candidate) => candidate.id === allocation.stockLayerId);
          if (!layer) {
            throw new Error(
              `يشير التخصيص إلى طبقة مخزون غير معروفة ${allocation.stockLayerId} for ingredient ${line.ingredientId}`,
            );
          }

          const nextRemaining = Number(layer.remainingQuantity) - Number(allocation.allocatedQuantity);
          await tx
            .update(stockLayersTable)
            .set({ remainingQuantity: nextRemaining.toFixed(3) })
            .where(eq(stockLayersTable.id, layer.id));
        }

        await tx
          .update(productionBatchLinesTable)
          .set({
            unitCost: allocationResult.unitCost.toFixed(6),
            lineCost: allocationResult.lineCost.toFixed(3),
          })
          .where(eq(productionBatchLinesTable.id, line.id));

        totalCost += allocationResult.lineCost;
      }

      const batchUnitCost = totalCost / input.producedQuantity;

      await tx
        .update(productionBatchesTable)
        .set({
          totalCost: totalCost.toFixed(3),
          unitCost: batchUnitCost.toFixed(6),
        })
        .where(eq(productionBatchesTable.id, batchId));

      await tx.insert(stockLayersTable).values(
        buildProductionBatchOutputLayer({
          batchId,
          productId: input.productId,
          producedQuantity: input.producedQuantity,
          totalCost,
          occurredAt,
        }),
      );

      // Recalculate inside the same transaction so the batch and the derived
      // stock balances commit (or roll back) atomically. A backdated batch that
      // makes a later record over-consume surfaces here as a ledger conflict and
      // rolls the whole insert back.
      await recalculateStockBalances(tx);

      return batchId;
    });
  } catch (error) {
    if (error instanceof StockLedgerConflictError) {
      const conflicting = preparedLines.find((line) => line.ingredientId === error.itemId);
      const ingredientLabel = conflicting
        ? conflicting.ingredientName
        : `#${error.itemId}`;
      throw new ProductionBatchValidationError(
        `حفظ هذه التشغيلة سيجعل مخزون الخامة (${ingredientLabel}) بالسالب في سجل لاحق`,
      );
    }

    throw error;
  }
}

async function validateProductionBatchRelations(input: ProductionBatchInput) {
  const product = await db.query.productsTable.findFirst({
    where: eq(productsTable.id, input.productId),
  });

  if (!product) {
    throw new ProductionBatchValidationError("المنتج غير موجود");
  }

  const ingredientIds = [...new Set(input.lines.map((line) => line.ingredientId))];
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(or(...ingredientIds.map((id) => eq(ingredientsTable.id, id))));

  if (ingredients.length !== ingredientIds.length) {
    throw new ProductionBatchValidationError("خامة واحدة أو أكثر غير موجودة");
  }

  return {
    ingredientsById: new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
  };
}
