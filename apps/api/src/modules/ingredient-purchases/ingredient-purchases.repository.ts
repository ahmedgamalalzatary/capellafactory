import type {
  IngredientPurchase,
  IngredientPurchaseInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import { and, asc, eq, like, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
  stockLayersTable,
  suppliersTable,
} from "../../db/schema/index.js";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import { buildIngredientPurchaseInvoiceCode } from "../../services/invoice-code.service.js";
import { recalculateIngredientBalances } from "../../services/stock-costing.service.js";
import {
  buildIngredientPurchaseStockLayer,
  resolveIngredientPurchaseLineCost,
  resolveIngredientPurchaseSupplierFields,
} from "./ingredient-purchases.allocation.js";
import {
  compareIngredientPurchaseListOrder,
  mapIngredientPurchaseRowToIngredientPurchase,
  normalizeIngredientPurchaseSearchQuery,
} from "./ingredient-purchases.mappers.js";
import {
  IngredientPurchaseValidationError,
  validateIngredientPurchaseLineUnit,
} from "./ingredient-purchases.validators.js";

export async function listIngredientPurchases(query?: string) {
  const normalizedQuery = normalizeIngredientPurchaseSearchQuery(query);
  const rows = await db
    .select()
    .from(ingredientPurchasesTable)
    .where(
      and(
        normalizedQuery
          ? or(
              like(ingredientPurchasesTable.invoiceCode, `%${normalizedQuery}%`),
              like(ingredientPurchasesTable.supplierName, `%${normalizedQuery}%`),
              like(ingredientPurchasesTable.notes, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(ingredientPurchasesTable.occurredAt), asc(ingredientPurchasesTable.id));

  const purchases = (await Promise.all(
    rows.map((row) => getIngredientPurchaseById(row.id)),
  )) as IngredientPurchase[];

  return purchases.sort(compareIngredientPurchaseListOrder);
}

export async function getIngredientPurchaseById(id: number) {
  const row = await db.query.ingredientPurchasesTable.findFirst({
    where: eq(ingredientPurchasesTable.id, id),
  });

  if (!row) {
    return null;
  }

  const lines = await db
    .select()
    .from(ingredientPurchaseLinesTable)
    .where(eq(ingredientPurchaseLinesTable.purchaseId, id))
    .orderBy(asc(ingredientPurchaseLinesTable.id));

  return mapIngredientPurchaseRowToIngredientPurchase(row, lines);
}

export async function createIngredientPurchase(input: IngredientPurchaseInput) {
  const relationState = await validateIngredientPurchaseRelations(input);
  const supplierFields = resolveIngredientPurchaseSupplierFields(
    input,
    relationState.supplierName,
  );

  const insertedId = await db.transaction(async (tx) => {
    const occurredAt = new Date(input.occurredAt);

    const inserted = await tx
      .insert(ingredientPurchasesTable)
      .values({
        invoiceCode: "",
        occurredAt,
        supplierId: supplierFields.supplierId,
        supplierName: supplierFields.supplierName,
        notes: input.notes,
      })
      .$returningId();

    const purchaseId = inserted[0]?.id;

    if (!purchaseId) {
      throw new Error("Failed to create ingredient purchase");
    }

    await tx
      .update(ingredientPurchasesTable)
      .set({
        invoiceCode: buildIngredientPurchaseInvoiceCode(occurredAt, purchaseId),
      })
      .where(eq(ingredientPurchasesTable.id, purchaseId));

    await tx.insert(ingredientPurchaseLinesTable).values(
      input.lines.map((line) => {
        const ingredient = relationState.ingredientsById.get(line.ingredientId);

        if (!ingredient) {
          throw new Error(`Ingredient ${line.ingredientId} not found`);
        }

        validateIngredientPurchaseLineUnit(ingredient.unitFamily, line.unit);

        const normalizedQuantity = normalizeIngredientQuantity(ingredient.unitFamily, line.quantity, line.unit);
        const lineCost = resolveIngredientPurchaseLineCost(line);

        return {
          purchaseId,
          ingredientId: line.ingredientId,
          quantity: line.quantity.toFixed(3),
          unit: line.unit,
          unitPrice: lineCost.unitPrice.toFixed(3),
          lineTotal: lineCost.lineTotal.toFixed(3),
          normalizedQuantity: normalizedQuantity.toFixed(3),
        };
      }),
    );

    const insertedLines = await tx
      .select()
      .from(ingredientPurchaseLinesTable)
      .where(eq(ingredientPurchaseLinesTable.purchaseId, purchaseId))
      .orderBy(asc(ingredientPurchaseLinesTable.id));

    await tx.insert(stockLayersTable).values(
      insertedLines.map((line) =>
        buildIngredientPurchaseStockLayer({
          purchaseId,
          purchaseLineId: line.id,
          ingredientId: line.ingredientId,
          normalizedQuantity: Number(line.normalizedQuantity),
          lineTotal: Number(line.lineTotal),
          occurredAt,
        }),
      ),
    );

    // Recalculate inside the same transaction so the purchase and the derived
    // stock balances commit (or roll back) atomically.
    await recalculateIngredientBalances(tx);

    return purchaseId;
  });

  const purchase = await getIngredientPurchaseById(insertedId);

  if (!purchase) {
    throw new Error(`Failed to load created ingredient purchase with id ${insertedId}`);
  }

  return purchase;
}

async function validateIngredientPurchaseRelations(input: IngredientPurchaseInput) {
  const supplier = await db.query.suppliersTable.findFirst({
    where: eq(suppliersTable.id, input.supplierId),
  });

  if (!supplier) {
    throw new IngredientPurchaseValidationError("Supplier not found");
  }

  const ingredientIds = [...new Set(input.lines.map((line) => line.ingredientId))];
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(or(...ingredientIds.map((id) => eq(ingredientsTable.id, id))));

  if (ingredients.length !== ingredientIds.length) {
    throw new IngredientPurchaseValidationError("One or more ingredients were not found");
  }

  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const line of input.lines) {
    const ingredient = ingredientsById.get(line.ingredientId);

    if (!ingredient) {
      throw new IngredientPurchaseValidationError("One or more ingredients were not found");
    }

    validateIngredientPurchaseLineUnit(ingredient.unitFamily, line.unit);
  }

  return {
    ingredientsById,
    supplierName: supplier.name,
  };
}
