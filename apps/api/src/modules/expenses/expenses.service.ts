import type { ExpenseInput } from "@capella/shared/expenses/expense.types";
import { createExpense, getExpenseById, listExpenses } from "./expenses.repository.js";

export async function getExpenses(query?: string) {
  return listExpenses(query);
}

export async function getExpense(id: number) {
  return getExpenseById(id);
}

export async function addExpense(input: ExpenseInput) {
  return createExpense(input);
}
