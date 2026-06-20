import type {
  IngredientPurchase,
  IngredientPurchaseInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import { additionalPaymentInputSchema } from "@capella/shared/payments/payment.schema";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasePaymentsTable,
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
  createIngredientPurchasePaymentTotalLookup,
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

  const paymentTotals = await getIngredientPurchasePaymentTotals([id]);
  const payments = await getIngredientPurchasePayments(id);

  return mapIngredientPurchaseRowToIngredientPurchase(
    row,
    lines,
    paymentTotals.get(id) ?? Number(row.totalAmount),
    payments,
  );
}

export async function createIngredientPurchase(input: IngredientPurchaseInput) {
  const relationState = await validateIngredientPurchaseRelations(input);
  const supplierFields = resolveIngredientPurchaseSupplierFields(
    input,
    relationState.supplierName,
  );

  const insertedId = await db.transaction(async (tx) => {
    const occurredAt = new Date(input.occurredAt);
    const totalAmount = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);

    const inserted = await tx
      .insert(ingredientPurchasesTable)
      .values({
        invoiceCode: "",
        occurredAt,
        totalAmount: totalAmount.toFixed(3),
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

    if (input.paidAmount > 0 && input.paymentMethod && input.paidAt) {
      await tx.insert(ingredientPurchasePaymentsTable).values({
        purchaseId,
        amount: input.paidAmount.toFixed(3),
        paymentMethod: input.paymentMethod,
        paidAt: new Date(input.paidAt),
      });
    }

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

export async function addIngredientPurchasePayment(id: number, input: AdditionalPaymentInput) {
  const purchase = await getIngredientPurchaseById(id);

  if (!purchase) {
    return null;
  }

  const result = additionalPaymentInputSchema.safeParse({
    ...input,
    remainingAmount: purchase.remainingAmount,
  });

  if (!result.success) {
    throw new IngredientPurchaseValidationError(result.error.issues[0]?.message ?? "Invalid payment");
  }

  await db.insert(ingredientPurchasePaymentsTable).values({
    purchaseId: id,
    amount: input.amount.toFixed(3),
    paymentMethod: input.paymentMethod,
    paidAt: new Date(input.paidAt),
  });

  return getIngredientPurchaseById(id);
}

async function getIngredientPurchasePaymentTotals(purchaseIds: number[]) {
  if (purchaseIds.length === 0) {
    return new Map<number, number>();
  }

  const rows = await db
    .select({
      purchaseId: ingredientPurchasePaymentsTable.purchaseId,
      paidAmount: sql<string | null>`sum(${ingredientPurchasePaymentsTable.amount})`,
    })
    .from(ingredientPurchasePaymentsTable)
    .where(inArray(ingredientPurchasePaymentsTable.purchaseId, purchaseIds))
    .groupBy(ingredientPurchasePaymentsTable.purchaseId);

  return createIngredientPurchasePaymentTotalLookup(rows);
}

async function getIngredientPurchasePayments(purchaseId: number) {
  return db
    .select({
      id: ingredientPurchasePaymentsTable.id,
      amount: ingredientPurchasePaymentsTable.amount,
      paymentMethod: ingredientPurchasePaymentsTable.paymentMethod,
      paidAt: ingredientPurchasePaymentsTable.paidAt,
    })
    .from(ingredientPurchasePaymentsTable)
    .where(eq(ingredientPurchasePaymentsTable.purchaseId, purchaseId))
    .orderBy(asc(ingredientPurchasePaymentsTable.paidAt), asc(ingredientPurchasePaymentsTable.id));
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
