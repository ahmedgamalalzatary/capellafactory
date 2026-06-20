import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { findExpenseTypesByLabelQuery } from "@capella/shared/expenses/expense.constants";
import type { Expense, ExpenseInput } from "@capella/shared/expenses/expense.types";
import { additionalPaymentInputSchema, createPaymentSummary } from "@capella/shared/payments/payment.schema";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { db } from "../../db/index.js";
import { expensePaymentsTable, expensesTable } from "../../db/schema/expenses.js";
import { ExpenseValidationError } from "./expenses.validators.js";

type ExpenseRow = typeof expensesTable.$inferSelect;
type ExpenseInsert = typeof expensesTable.$inferInsert;
type ExpensePaymentTotalRow = { expenseId: number; paidAmount: string | null };

export function mapExpenseRowToExpense(row: ExpenseRow, paidAmount = Number(row.amount)): Expense {
  const amount = Number(row.amount);
  const summary = createPaymentSummary({
    totalAmount: amount,
    paidAmount,
  });

  return {
    id: row.id,
    type: row.type,
    amount,
    paidAmount: summary.paidAmount,
    remainingAmount: summary.remainingAmount,
    paymentStatus: summary.paymentStatus,
    occurredAt: toIsoString(row.occurredAt),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.employeeName ? { employeeName: row.employeeName } : {}),
    ...(row.otherLabel ? { otherLabel: row.otherLabel } : {}),
    createdAt: toIsoString(row.createdAt),
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
              like(expensesTable.type, `%${normalizedQuery}%`),
              like(expensesTable.notes, `%${normalizedQuery}%`),
              like(expensesTable.employeeName, `%${normalizedQuery}%`),
              like(expensesTable.otherLabel, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(expensesTable.occurredAt), asc(expensesTable.id));

  const paymentTotals = await getExpensePaymentTotals(expenses.map((expense) => expense.id));

  return expenses.map((expense) =>
    mapExpenseRowToExpense(expense, paymentTotals.get(expense.id) ?? Number(expense.amount)),
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

  return mapExpenseRowToExpense(expense, paymentTotals.get(expense.id) ?? Number(expense.amount));
}

export async function createExpense(input: ExpenseInput) {
  const inserted = await db.transaction(async (tx) => {
    const insertedExpense = await tx.insert(expensesTable).values(toExpenseInsert(input)).$returningId();
    const id = insertedExpense[0]?.id;

    if (id && input.paidAmount > 0 && input.paymentMethod && input.paidAt) {
      await tx.insert(expensePaymentsTable).values({
        expenseId: id,
        amount: input.paidAmount.toFixed(3),
        paymentMethod: input.paymentMethod,
        paidAt: new Date(input.paidAt),
      });
    }

    return insertedExpense;
  });
  const id = inserted[0]?.id;

  if (!id) {
    throw new Error(`Insert did not return a valid id; got: ${JSON.stringify(inserted)}`);
  }

  const expense = await getExpenseById(id);

  if (!expense) {
    throw new Error(`Failed to load created expense with id ${id}`);
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
    throw new ExpenseValidationError(result.error.issues[0]?.message ?? "Invalid payment");
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
  return {
    type: input.type,
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

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
