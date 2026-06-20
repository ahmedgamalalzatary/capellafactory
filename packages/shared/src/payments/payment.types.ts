export type PaymentMethod = "visa" | "vodafone_cash" | "cod" | "instapay";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface AdditionalPaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
}
