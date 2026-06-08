import type {
  IngredientPurchaseInput,
  IngredientPurchase,
  IngredientPurchaseLineInput,
  IngredientPurchaseLine,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";
import { and, asc, eq, like, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
  suppliersTable,
} from "../../db/schema/index.js";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import { buildIngredientPurchaseInvoiceCode } from "../../services/invoice-code.service.js";
import { recalculateIngredientBalances } from "../../services/stock-costing.service.js";

export class IngredientPurchaseValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

type IngredientPurchaseRow = {
  id: number;
  invoiceCode: string;
  occurredAt: Date | string;
  supplierId: number | null;
  supplierName: string | null;
  notes: string | null;
  createdAt: Date | string;
};

type IngredientPurchaseLineRow = {
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

export function validateIngredientPurchaseLineUnit(
  unitFamily: IngredientUnitFamily,
  unit: IngredientPurchaseLine["unit"],
) {
  try {
    normalizeIngredientQuantity(unitFamily, 1, unit);
  } catch (error) {
    if (error instanceof Error) {
      throw new IngredientPurchaseValidationError(error.message);
    }

    throw error;
  }
}

export function resolveIngredientPurchaseSupplierFields(
  input: Pick<IngredientPurchaseInput, "supplierId" | "supplierName">,
  savedSupplierName?: string,
) {
  if (input.supplierId !== undefined) {
    return {
      supplierId: input.supplierId,
      supplierName: savedSupplierName,
    };
  }

  return {
    supplierId: undefined,
    supplierName: input.supplierName,
  };
}

export function resolveIngredientPurchaseLineCost(
  line: Pick<IngredientPurchaseLineInput, "quantity" | "lineTotal">,
) {
  return {
    unitPrice: line.lineTotal / line.quantity,
    lineTotal: line.lineTotal,
  };
}

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

  return Promise.all(rows.map((row) => getIngredientPurchaseById(row.id))) as Promise<IngredientPurchase[]>;
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
  let supplierName: string | undefined;

  if (input.supplierId !== undefined) {
    const supplier = await db.query.suppliersTable.findFirst({
      where: eq(suppliersTable.id, input.supplierId),
    });

    if (!supplier) {
      throw new IngredientPurchaseValidationError("Supplier not found");
    }

    supplierName = supplier.name;
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
    supplierName,
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
