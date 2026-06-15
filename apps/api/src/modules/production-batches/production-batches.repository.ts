import type {
  ProductionBatch,
  ProductionBatchIngredientLine,
  ProductionBatchInput,
} from "@capella/shared/production-batches/production-batch.types";
import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";
import { and, asc, eq, like, or } from "drizzle-orm";
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
import type { ProductionBatchStockCheck } from "./production-batches.types.js";

export class ProductionBatchValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

type ProductionBatchRow = {
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

type ProductionBatchLineRow = {
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

function formatStockQuantity(value: number) {
  return parseFloat(value.toFixed(3)).toString();
}

export function calculateProductionBatchLineCostFromAllocations(
  allocations: Array<{ allocatedQuantity: number; allocatedCost: number }>,
) {
  const quantity = Number(
    allocations.reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0).toFixed(3),
  );
  const lineCost = Number(
    allocations.reduce((sum, allocation) => sum + allocation.allocatedCost, 0).toFixed(3),
  );

  return {
    quantity,
    lineCost,
    unitCost: quantity > 0 ? Number((lineCost / quantity).toFixed(6)) : 0,
  };
}

export function buildProductionBatchIngredientAllocationRequest(input: {
  ingredientId: number;
  batchId: number;
  batchLineId: number;
  normalizedQuantity: number;
  occurredAt: Date;
}) {
  return {
    domain: "ingredient" as const,
    itemId: input.ingredientId,
    outboundDocumentType: "production-consumption",
    outboundDocumentId: input.batchId,
    outboundLineId: input.batchLineId,
    quantity: input.normalizedQuantity,
    occurredAt: input.occurredAt,
  };
}

export function buildProductionBatchOutputLayer(input: {
  batchId: number;
  productId: number;
  producedQuantity: number;
  totalCost: number;
  occurredAt: Date;
}) {
  return {
    domain: "product" as const,
    itemId: input.productId,
    sourceDocumentType: "production-output",
    sourceDocumentId: input.batchId,
    sourceLineId: null,
    originalQuantity: input.producedQuantity.toFixed(3),
    remainingQuantity: input.producedQuantity.toFixed(3),
    unitCost: (input.totalCost / input.producedQuantity).toFixed(6),
    totalCost: input.totalCost.toFixed(3),
    occurredAt: input.occurredAt,
  };
}

export function allocateProductionBatchLineFromLayers(
  request: {
    ingredientId: number;
    batchId: number;
    batchLineId: number;
    normalizedQuantity: number;
    occurredAt: Date;
  },
  layers: Array<{
    id: number;
    sourceLineId?: number | null;
    remainingQuantity: number;
    unitCost: number;
  }>,
) {
  const allocations: Array<{
    domain: "ingredient";
    itemId: number;
    outboundDocumentType: "production-consumption";
    outboundDocumentId: number;
    outboundLineId: number;
    stockLayerId: number;
    allocatedQuantity: string;
    unitCost: string;
    allocatedCost: string;
    occurredAt: Date;
  }> = [];

  let remaining = request.normalizedQuantity;

  for (const layer of layers) {
    if (remaining <= 0) {
      break;
    }

    const allocatedQuantity = Math.min(layer.remainingQuantity, remaining);
    if (allocatedQuantity <= 0) {
      continue;
    }

    const allocatedCost = allocatedQuantity * layer.unitCost;
    allocations.push({
      domain: "ingredient",
      itemId: request.ingredientId,
      outboundDocumentType: "production-consumption",
      outboundDocumentId: request.batchId,
      outboundLineId: request.batchLineId,
      stockLayerId: layer.id,
      allocatedQuantity: allocatedQuantity.toFixed(3),
      unitCost: layer.unitCost.toFixed(6),
      allocatedCost: allocatedCost.toFixed(3),
      occurredAt: request.occurredAt,
    });

    remaining = Number((remaining - allocatedQuantity).toFixed(3));
  }

  const costSummary = calculateProductionBatchLineCostFromAllocations(
    allocations.map((allocation) => ({
      allocatedQuantity: Number(allocation.allocatedQuantity),
      allocatedCost: Number(allocation.allocatedCost),
    })),
  );

  return {
    allocations,
    lineCost: costSummary.lineCost,
    unitCost: costSummary.unitCost,
  };
}

export function validateProductionBatchStock(checks: ProductionBatchStockCheck[]) {
  const shortages = checks.filter((check) => check.requestedQuantity > check.availableQuantity);

  if (shortages.length === 0) {
    return;
  }

  const details = shortages
    .map(
      (check) =>
        `${check.ingredientName} (متاح ${formatStockQuantity(check.availableQuantity)}، مطلوب ${formatStockQuantity(check.requestedQuantity)})`,
    )
    .join("؛ ");

  throw new ProductionBatchValidationError(`المخزون غير كافٍ من: ${details}`);
}

export function validateProductionBatchLineUnit(
  unitFamily: IngredientUnitFamily,
  unit: ProductionBatchIngredientLine["unit"],
) {
  try {
    normalizeIngredientQuantity(unitFamily, 1, unit);
  } catch (error) {
    if (error instanceof Error) {
      throw new ProductionBatchValidationError(error.message);
    }

    throw error;
  }
}

export async function listProductionBatches(query?: string) {
  const normalizedQuery = normalizeProductionBatchSearchQuery(query);
  const rows = await db
    .select()
    .from(productionBatchesTable)
    .where(
      and(
        normalizedQuery
          ? or(
              like(productionBatchesTable.batchCode, `%${normalizedQuery}%`),
              like(productionBatchesTable.notes, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(productionBatchesTable.occurredAt), asc(productionBatchesTable.id));

  return Promise.all(rows.map((row) => getProductionBatchById(row.id))) as Promise<
    ProductionBatch[]
  >;
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
      throw new ProductionBatchValidationError("One or more ingredients were not found");
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
    throw new ProductionBatchValidationError("producedQuantity must be > 0");
  }

  const insertedId = await createProductionBatchTransaction(input, preparedLines);

  const batch = await getProductionBatchById(insertedId);

  if (!batch) {
    throw new Error(`Failed to load created production batch with id ${insertedId}`);
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
        throw new Error("Failed to create production batch");
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
            continue;
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
      const conflicting = preparedLines.find((line) => line.ingredientId === error.ingredientId);
      const ingredientLabel = conflicting
        ? conflicting.ingredientName
        : `#${error.ingredientId}`;
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
    throw new ProductionBatchValidationError("Product not found");
  }

  const ingredientIds = [...new Set(input.lines.map((line) => line.ingredientId))];
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(or(...ingredientIds.map((id) => eq(ingredientsTable.id, id))));

  if (ingredients.length !== ingredientIds.length) {
    throw new ProductionBatchValidationError("One or more ingredients were not found");
  }

  return {
    ingredientsById: new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
