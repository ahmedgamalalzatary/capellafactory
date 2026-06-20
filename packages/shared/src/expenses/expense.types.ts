import type { PaymentMethod, PaymentStatus } from "../payments/payment.types.js";

export const expenseTypes = [
  "rent",
  "food",
  "water",
  "gas",
  "electricity",
  "internet",
  "salary",
  "other",
] as const;

export type ExpenseType = (typeof expenseTypes)[number];

export type Expense = {
  id: number;
  type: ExpenseType;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  occurredAt: string;
  notes?: string;
  employeeName?: string;
  otherLabel?: string;
  createdAt: string;
};

export type ExpenseInput = {
  type: ExpenseType;
  amount: number;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  occurredAt: string;
  notes?: string;
  employeeName?: string;
  otherLabel?: string;
};
