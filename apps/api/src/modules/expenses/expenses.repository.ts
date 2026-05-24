import { and, asc, eq, like, or } from "drizzle-orm";
import type { Expense, ExpenseInput } from "@capella/shared/expenses/expense.types";
import { db } from "../../db/index.js";
import { expensesTable } from "../../db/schema/expenses.js";

type ExpenseRow = typeof expensesTable.$inferSelect;
type ExpenseInsert = typeof expensesTable.$inferInsert;

export function mapExpenseRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
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

export async function listExpenses(query?: string) {
  const normalizedQuery = normalizeExpenseSearchQuery(query);
  const expenses = await db
    .select()
    .from(expensesTable)
    .where(
      and(
        normalizedQuery
          ? or(
              like(expensesTable.type, `%${normalizedQuery}%`),
              like(expensesTable.notes, `%${normalizedQuery}%`),
              like(expensesTable.employeeName, `%${normalizedQuery}%`),
              like(expensesTable.otherLabel, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(expensesTable.occurredAt), asc(expensesTable.id));

  return expenses.map(mapExpenseRowToExpense);
}

export async function getExpenseById(id: number) {
  const expense = await db.query.expensesTable.findFirst({
    where: eq(expensesTable.id, id),
  });

  return expense ? mapExpenseRowToExpense(expense) : null;
}

export async function createExpense(input: ExpenseInput) {
  const inserted = await db.insert(expensesTable).values(toExpenseInsert(input)).$returningId();
  const expense = await getExpenseById(inserted[0]?.id ?? 0);

  if (!expense) {
    throw new Error("Failed to load created expense");
  }

  return expense;
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

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
