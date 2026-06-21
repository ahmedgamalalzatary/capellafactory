import type { AdditionalPaymentInput } from "./payment.types.js";

export const adjustmentStates = ["active", "inactive"] as const;
export const adjustmentTypes = ["amount", "percentage"] as const;

export type AdjustmentState = (typeof adjustmentStates)[number];
export type AdjustmentType = (typeof adjustmentTypes)[number];

export type DocumentAdjustmentInput = {
  state: AdjustmentState;
  type?: AdjustmentType;
  value: number;
};

export type DocumentAdjustmentsInput = {
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
};

export type DocumentPaymentInput = AdditionalPaymentInput;

export type DocumentTotals = {
  baseTotal: number;
  taxAmount: number;
  totalAfterTax: number;
  discountAmount: number;
  finalTotal: number;
};
