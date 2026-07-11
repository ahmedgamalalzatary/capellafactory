import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { findExpenseTypesByLabelQuery } from "@capella/shared/expenses/expense.constants";
import type { Expense, ExpenseInput } from "@capella/shared/expenses/expense.types";
import { calculateDocumentTotals } from "@capella/shared/payments/document-payment.schema";
import { additionalPaymentInputSchema, createPaymentSummary } from "@capella/shared/payments/payment.schema";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { escapeLike } from "../../utils/search.js";
import { db } from "../../db/index.js";
import { expensePaymentsTable, expensesTable } from "../../db/schema/expenses.js";
import { ExpenseValidationError } from "./expenses.validators.js";

type ExpenseRow = typeof expensesTable.$inferSelect;
type ExpenseInsert = typeof expensesTable.$inferInsert;
type ExpensePaymentTotalRow = { expenseId: number; paidAmount: string | null };
type ExpensePaymentRow = {
  id: number;
  amount: string | number;
  paymentMethod: Expense["payments"][number]["paymentMethod"];
  paidAt: Date | string;
};

export function mapExpenseRowToExpense(
  row: ExpenseRow,
  paidAmount = 0,
  payments: ExpensePaymentRow[] = [],
): Expense {
  const amount = Number(row.amount);
  const baseTotal = Number((row as ExpenseRow & { baseTotal?: string | number }).baseTotal ?? row.amount);
  const taxState = (row as ExpenseRow & { taxState?: Expense["taxState"] }).taxState ?? "inactive";
  const taxType = (row as ExpenseRow & { taxType?: Expense["taxType"] | null }).taxType ?? undefined;
  const taxValue = Number((row as ExpenseRow & { taxValue?: string | number }).taxValue ?? 0);
  const taxAmount = Number((row as ExpenseRow & { taxAmount?: string | number }).taxAmount ?? 0);
  const totalAfterTax = Number(
    (row as ExpenseRow & { totalAfterTax?: string | number }).totalAfterTax ?? row.amount,
  );
  const discountState =
    (row as ExpenseRow & { discountState?: Expense["discountState"] }).discountState ?? "inactive";
  const discountType =
    (row as ExpenseRow & { discountType?: Expense["discountType"] | null }).discountType ?? undefined;
  const discountValue = Number(
    (row as ExpenseRow & { discountValue?: string | number }).discountValue ?? 0,
  );
  const discountAmount = Number(
    (row as ExpenseRow & { discountAmount?: string | number }).discountAmount ?? 0,
  );
  const finalTotal = Number(
    (row as ExpenseRow & { finalTotal?: string | number }).finalTotal ?? row.amount,
  );
  const summary = createPaymentSummary({
    totalAmount: finalTotal,
    paidAmount,
  });

  return {
    id: row.id,
    type: row.type,
    baseTotal,
    taxState,
    taxType,
    taxValue,
    taxAmount,
    totalAfterTax,
    discountState,
    discountType,
    discountValue,
    discountAmount,
    finalTotal,
    amount,
    paidAmount: summary.paidAmount,
    remainingAmount: summary.remainingAmount,
    paymentStatus: summary.paymentStatus,
    occurredAt: toIsoString(row.occurredAt),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.employeeName ? { employeeName: row.employeeName } : {}),
    ...(row.otherLabel ? { otherLabel: row.otherLabel } : {}),
    createdAt: toIsoString(row.createdAt),
    payments: payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paidAt: toIsoString(payment.paidAt),
    })),
  };
}

export function normalizeExpenseSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export function findExpenseTypesBySearchQuery(query?: string) {
  return findExpenseTypesByLabelQuery(query);
}

export function createExpensePaymentTotalLookup(rows: ExpensePaymentTotalRow[]) {
  return new Map(rows.map((row) => [row.expenseId, row.paidAmount ? Number(row.paidAmount) : 0]));
}

export async function listExpenses(query?: string) {
  const normalizedQuery = normalizeExpenseSearchQuery(query);
  const matchingTypes = findExpenseTypesBySearchQuery(normalizedQuery);
  const expenses = await db
    .select()
    .from(expensesTable)
    .where(
      and(
        normalizedQuery
          ? or(
              ...matchingTypes.map((type) => eq(expensesTable.type, type)),
              like(expensesTable.type, `%${escapeLike(normalizedQuery)}%`),
              like(expensesTable.notes, `%${escapeLike(normalizedQuery)}%`),
              like(expensesTable.employeeName, `%${escapeLike(normalizedQuery)}%`),
              like(expensesTable.otherLabel, `%${escapeLike(normalizedQuery)}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(expensesTable.occurredAt), asc(expensesTable.id));

  const paymentTotals = await getExpensePaymentTotals(expenses.map((expense) => expense.id));

  return expenses.map((expense) =>
    mapExpenseRowToExpense(expense, paymentTotals.get(expense.id) ?? 0),
  );
}

export async function getExpenseById(id: number) {
  const expense = await db.query.expensesTable.findFirst({
    where: eq(expensesTable.id, id),
  });

  if (!expense) {
    return null;
  }

  const paymentTotals = await getExpensePaymentTotals([expense.id]);
  const payments = await getExpensePayments(expense.id);

  return mapExpenseRowToExpense(
    expense,
    paymentTotals.get(expense.id) ?? 0,
    payments,
  );
}

export async function createExpense(input: ExpenseInput) {
  const inserted = await db.transaction(async (tx) => {
    const insertedExpense = await tx.insert(expensesTable).values(toExpenseInsert(input)).$returningId();
    const id = insertedExpense[0]?.id;

    if (id && input.payments.length > 0) {
      await tx.insert(expensePaymentsTable).values(
        input.payments.map((payment) => ({
          expenseId: id,
          amount: payment.amount.toFixed(3),
          paymentMethod: payment.paymentMethod,
          paidAt: new Date(payment.paidAt),
        })),
      );
    }

    return insertedExpense;
  });
  const id = inserted[0]?.id;

  if (!id) {
    throw new Error(`لم تُرجع عملية الحفظ معرّفًا صالحًا`);
  }

  const expense = await getExpenseById(id);

  if (!expense) {
    throw new Error(`تعذر تحميل المصروف الذي تم إنشاؤه برقم ${id}`);
  }

  return expense;
}

export async function addExpensePayment(id: number, input: AdditionalPaymentInput) {
  const expense = await getExpenseById(id);

  if (!expense) {
    return null;
  }

  const result = additionalPaymentInputSchema.safeParse({
    ...input,
    remainingAmount: expense.remainingAmount,
  });

  if (!result.success) {
    throw new ExpenseValidationError(result.error.issues[0]?.message ?? "بيانات الدفعة غير صالحة");
  }

  await db.insert(expensePaymentsTable).values({
    expenseId: id,
    amount: input.amount.toFixed(3),
    paymentMethod: input.paymentMethod,
    paidAt: new Date(input.paidAt),
  });

  return getExpenseById(id);
}

function toExpenseInsert(input: ExpenseInput): ExpenseInsert {
  const totals = calculateDocumentTotals(input.amount, input);

  return {
    type: input.type,
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
    amount: input.amount.toFixed(3),
    occurredAt: new Date(input.occurredAt),
    notes: input.notes,
    employeeName: input.employeeName,
    otherLabel: input.otherLabel,
  };
}

async function getExpensePaymentTotals(expenseIds: number[]) {
  if (expenseIds.length === 0) {
    return new Map<number, number>();
  }

  const rows = await db
    .select({
      expenseId: expensePaymentsTable.expenseId,
      paidAmount: sql<string | null>`sum(${expensePaymentsTable.amount})`,
    })
    .from(expensePaymentsTable)
    .where(inArray(expensePaymentsTable.expenseId, expenseIds))
    .groupBy(expensePaymentsTable.expenseId);

  return createExpensePaymentTotalLookup(rows);
}

async function getExpensePayments(expenseId: number) {
  return db
    .select({
      id: expensePaymentsTable.id,
      amount: expensePaymentsTable.amount,
      paymentMethod: expensePaymentsTable.paymentMethod,
      paidAt: expensePaymentsTable.paidAt,
    })
    .from(expensePaymentsTable)
    .where(eq(expensePaymentsTable.expenseId, expenseId))
    .orderBy(asc(expensePaymentsTable.paidAt), asc(expensePaymentsTable.id));
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
