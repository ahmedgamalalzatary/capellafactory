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
    amount: z.coerce.number().positive("Payment amount must be greater than zero"),
    paymentMethod: paymentMethodSchema,
    paidAt: z.string().datetime({ offset: true }),
  })
  .strict() satisfies z.ZodType<AdditionalPaymentInput>;

export const initialPaymentInputSchema = z
  .object({
    totalAmount: amountSchema,
    paidAmount: amountSchema,
    paymentMethod: paymentMethodSchema.optional(),
    paidAt: z.string().datetime().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paidAmount > value.totalAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "Paid amount cannot exceed total amount",
      });
    }

    if (value.paidAmount > 0 && !value.paymentMethod) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Payment method is required when paid amount is greater than zero",
      });
    }

    if (value.paidAmount > 0 && !value.paidAt) {
      ctx.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Payment date is required when paid amount is greater than zero",
      });
    }
  })
  .transform((value) =>
    value.paidAmount === 0
      ? { totalAmount: value.totalAmount, paidAmount: value.paidAmount }
      : value,
  );

export const additionalPaymentInputSchema = paymentInputSchema
  .extend({
    remainingAmount: amountSchema,
  })
  .superRefine((value, ctx) => {
    if (value.amount > value.remainingAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Payment amount cannot exceed remaining amount",
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
