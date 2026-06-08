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

export function validateProductionBatchStock(checks: ProductionBatchStockCheck[]) {
  for (const check of checks) {
    if (check.requestedQuantity > check.availableQuantity) {
      throw new ProductionBatchValidationError("Insufficient ingredient stock");
    }
  }
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
    const unitCost = Number(ingredient.averageUnitCost);
    const lineCost = normalizedQuantity * unitCost;

    return {
      ...line,
      normalizedQuantity,
      unitCost,
      lineCost,
      availableQuantity: Number(ingredient.stockQuantity),
    };
  });

  validateProductionBatchStock(
    preparedLines.map((line) => ({
      ingredientId: line.ingredientId,
      requestedQuantity: line.normalizedQuantity,
      availableQuantity: line.availableQuantity,
    })),
  );

  if (input.producedQuantity <= 0) {
    throw new ProductionBatchValidationError("producedQuantity must be > 0");
  }

  const totalCost = preparedLines.reduce((sum, line) => sum + line.lineCost, 0);
  const unitCost = totalCost / input.producedQuantity;

  const insertedId = await createProductionBatchTransaction(input, preparedLines, totalCost, unitCost);

  const batch = await getProductionBatchById(insertedId);

  if (!batch) {
    throw new Error(`Failed to load created production batch with id ${insertedId}`);
  }

  return batch;
}

type PreparedProductionLine = ProductionBatchInput["lines"][number] & {
  normalizedQuantity: number;
  unitCost: number;
  lineCost: number;
};

async function createProductionBatchTransaction(
  input: ProductionBatchInput,
  preparedLines: PreparedProductionLine[],
  totalCost: number,
  unitCost: number,
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
          totalCost: totalCost.toFixed(3),
          unitCost: unitCost.toFixed(6),
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
          unitCost: line.unitCost.toFixed(6),
          lineCost: line.lineCost.toFixed(3),
        })),
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
      throw new ProductionBatchValidationError(
        "Saving this batch would make a later record's ingredient stock negative",
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
