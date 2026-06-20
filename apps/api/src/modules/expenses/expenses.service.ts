import type { ExpenseInput } from "@capella/shared/expenses/expense.types";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import {
  addExpensePayment,
  createExpense,
  getExpenseById,
  listExpenses,
} from "./expenses.repository.js";

export async function getExpenses(query?: string) {
  return listExpenses(query);
}

export async function getExpense(id: number) {
  return getExpenseById(id);
}

export async function addExpense(input: ExpenseInput) {
  return createExpense(input);
}

export async function recordExpensePayment(id: number, input: AdditionalPaymentInput) {
  return addExpensePayment(id, input);
}
