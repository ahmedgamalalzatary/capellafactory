import type {
  IngredientPurchaseInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import { calculateDocumentTotals } from "@capella/shared/payments/document-payment.schema";
import { additionalPaymentInputSchema } from "@capella/shared/payments/payment.schema";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { escapeLike } from "../../utils/search.js";
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
  assembleIngredientPurchases,
  compareIngredientPurchaseListOrder,
  createIngredientPurchasePaymentTotalLookup,
  mapIngredientPurchaseRowToIngredientPurchase,
  normalizeIngredientPurchaseSearchQuery,
} from "./ingredient-purchases.mappers.js";
import {
  IngredientPurchaseValidationError,
  validateIngredientPurchaseLineUnit,
} from "./ingredient-purchases.validators.js";

export async function listIngredientPurchases(query?: string, supplierId?: number) {
  const normalizedQuery = normalizeIngredientPurchaseSearchQuery(query);
  const rows = await db
    .select()
    .from(ingredientPurchasesTable)
    .where(
      and(
        normalizedQuery
          ? or(
              like(ingredientPurchasesTable.invoiceCode, `%${escapeLike(normalizedQuery)}%`),
              like(ingredientPurchasesTable.supplierName, `%${escapeLike(normalizedQuery)}%`),
              like(ingredientPurchasesTable.notes, `%${escapeLike(normalizedQuery)}%`),
            )
          : undefined,
        supplierId ? eq(ingredientPurchasesTable.supplierId, supplierId) : undefined,
      ),
    )
    .orderBy(asc(ingredientPurchasesTable.occurredAt), asc(ingredientPurchasesTable.id));

  if (rows.length === 0) {
    return [];
  }

  const purchaseIds = rows.map((row) => row.id);

  const lines = await db
    .select()
    .from(ingredientPurchaseLinesTable)
    .where(inArray(ingredientPurchaseLinesTable.purchaseId, purchaseIds))
    .orderBy(asc(ingredientPurchaseLinesTable.purchaseId), asc(ingredientPurchaseLinesTable.id));

  const paymentTotals = await getIngredientPurchasePaymentTotals(purchaseIds);

  const payments = await db
    .select({
      purchaseId: ingredientPurchasePaymentsTable.purchaseId,
      id: ingredientPurchasePaymentsTable.id,
      amount: ingredientPurchasePaymentsTable.amount,
      paymentMethod: ingredientPurchasePaymentsTable.paymentMethod,
      paidAt: ingredientPurchasePaymentsTable.paidAt,
    })
    .from(ingredientPurchasePaymentsTable)
    .where(inArray(ingredientPurchasePaymentsTable.purchaseId, purchaseIds))
    .orderBy(asc(ingredientPurchasePaymentsTable.paidAt), asc(ingredientPurchasePaymentsTable.id));

  return assembleIngredientPurchases(rows, lines, paymentTotals, payments).sort(
    compareIngredientPurchaseListOrder,
  );
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
    paymentTotals.get(id) ?? 0,
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
    const baseTotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const totals = calculateDocumentTotals(baseTotal, input);

    const inserted = await tx
      .insert(ingredientPurchasesTable)
      .values({
        invoiceCode: "",
        occurredAt,
        baseTotal: totals.baseTotal.toFixed(3),
        taxState: input.taxState,
        taxType: input.taxType,
        taxValue: input.taxValue.toFixed(3),
        taxAmount: totals.taxAmount.toFixed(3),
        totalAfterTax: totals.totalAfterTax.toFixed(3),
        discountState: input.discountState,
        discountType: input.discountType,
        discountValue: input.discountValue.toFixed(3),
        discountAmount: totals.discountAmount.toFixed(3),
        finalTotal: totals.finalTotal.toFixed(3),
        totalAmount: totals.finalTotal.toFixed(3),
        supplierId: supplierFields.supplierId,
        supplierName: supplierFields.supplierName,
        notes: input.notes,
      })
      .$returningId();

    const purchaseId = inserted[0]?.id;

    if (!purchaseId) {
      throw new Error("تعذر إنشاء فاتورة الشراء");
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
          throw new Error(`الخامة ${line.ingredientId} غير موجودة`);
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

    if (input.payments.length > 0) {
      await tx.insert(ingredientPurchasePaymentsTable).values(
        input.payments.map((payment) => ({
          purchaseId,
          amount: payment.amount.toFixed(3),
          paymentMethod: payment.paymentMethod,
          paidAt: new Date(payment.paidAt),
        })),
      );
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
    throw new Error(`تعذر تحميل فاتورة الشراء التي تم إنشاؤها برقم ${insertedId}`);
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
    throw new IngredientPurchaseValidationError(result.error.issues[0]?.message ?? "بيانات الدفعة غير صالحة");
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
    throw new IngredientPurchaseValidationError("المورد غير موجود");
  }

  const ingredientIds = [...new Set(input.lines.map((line) => line.ingredientId))];
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(or(...ingredientIds.map((id) => eq(ingredientsTable.id, id))));

  if (ingredients.length !== ingredientIds.length) {
    throw new IngredientPurchaseValidationError("خامة واحدة أو أكثر غير موجودة");
  }

  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const line of input.lines) {
    const ingredient = ingredientsById.get(line.ingredientId);

    if (!ingredient) {
      throw new IngredientPurchaseValidationError("خامة واحدة أو أكثر غير موجودة");
    }

    validateIngredientPurchaseLineUnit(ingredient.unitFamily, line.unit);
  }

  return {
    ingredientsById,
    supplierName: supplier.name,
  };
}
