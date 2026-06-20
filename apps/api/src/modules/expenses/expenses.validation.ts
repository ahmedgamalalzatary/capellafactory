import { expenseInputSchema } from "@capella/shared/expenses/expense.schema";
import { paymentInputSchema } from "@capella/shared/payments/payment.schema";

export const createExpenseSchema = expenseInputSchema;
export const addExpensePaymentSchema = paymentInputSchema;
