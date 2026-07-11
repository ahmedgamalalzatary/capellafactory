import { z } from "zod";
import type { AdditionalPaymentInput, PaymentSummary } from "./payment.types.js";

export const PAYMENT_METHODS = [
  "visa",
  "vodafone_cash",
  "cod",
  "instapay",
] as const;

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

const amountSchema = z.coerce.number().min(0);

export const paymentInputSchema = z
  .object({
    amount: z.coerce.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
    paymentMethod: paymentMethodSchema,
    paidAt: z.string().datetime({ offset: true }),
  })
  .strict() satisfies z.ZodType<AdditionalPaymentInput>;

export const additionalPaymentInputSchema = paymentInputSchema
  .extend({
    remainingAmount: amountSchema,
  })
  .superRefine((value, ctx) => {
    if (value.amount > value.remainingAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "مبلغ الدفعة لا يمكن أن يتجاوز المبلغ المتبقي",
      });
    }
  });

export function createPaymentSummary(input: {
  totalAmount: number;
  paidAmount: number;
}): PaymentSummary {
  const remainingAmount = Math.max(input.totalAmount - input.paidAmount, 0);
  const paymentStatus =
    input.paidAmount <= 0
      ? "unpaid"
      : remainingAmount === 0
        ? "paid"
        : "partial";

  return {
    totalAmount: input.totalAmount,
    paidAmount: input.paidAmount,
    remainingAmount,
    paymentStatus,
  };
}
