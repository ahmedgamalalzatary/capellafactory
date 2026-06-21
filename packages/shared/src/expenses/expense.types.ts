import type {
  AdjustmentState,
  AdjustmentType,
  DocumentPaymentInput,
} from "../payments/document-payment.types.js";
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
  baseTotal: number;
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  taxAmount: number;
  totalAfterTax: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  occurredAt: string;
  notes?: string;
  employeeName?: string;
  otherLabel?: string;
  createdAt: string;
  payments: ExpensePayment[];
};

export type ExpensePayment = {
  id: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
};

export type ExpenseInput = {
  type: ExpenseType;
  amount: number;
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
  payments: DocumentPaymentInput[];
  occurredAt: string;
  notes?: string;
  employeeName?: string;
  otherLabel?: string;
};
