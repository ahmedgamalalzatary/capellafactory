import { z } from "zod";
import { expenseTypes } from "./expense.types.js";
import {
  adjustmentStateSchema,
  adjustmentTypeSchema,
  calculateDocumentTotals,
  documentPaymentsInputSchema,
  sumDocumentPayments,
  validateDocumentAdjustments,
} from "../payments/document-payment.schema.js";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const expenseInputSchema = z
  .object({
    type: z.enum(expenseTypes),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    taxState: adjustmentStateSchema,
    taxType: adjustmentTypeSchema.optional(),
    taxValue: z.coerce.number(),
    discountState: adjustmentStateSchema,
    discountType: adjustmentTypeSchema.optional(),
    discountValue: z.coerce.number(),
    payments: documentPaymentsInputSchema,
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "Occurred at must be a valid datetime" }),
    notes: optionalTrimmedString,
    employeeName: optionalTrimmedString,
    otherLabel: optionalTrimmedString,
  })
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
    employeeName: value.employeeName?.trim(),
    otherLabel: value.otherLabel?.trim(),
  }))
  .superRefine((value, ctx) => {
    validateDocumentAdjustments(value, ctx);

    const totals = calculateDocumentTotals(value.amount, value);
    const paidAmount = sumDocumentPayments(value.payments);

    if (totals.finalTotal >= 0 && paidAmount > totals.finalTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payments"],
        message: "Paid amount cannot exceed total amount",
      });
    }

    if (value.type === "salary" && !value.employeeName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employeeName"],
        message: "Employee name is required for salary expenses",
      });
    }

    if (value.type === "other" && !value.otherLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherLabel"],
        message: "Custom label is required for other expenses",
      });
    }

    if (totals.finalTotal < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Final total cannot be negative",
      });
    }
  })
  .transform((value) => ({
    ...value,
    taxType: value.taxState === "active" ? value.taxType : undefined,
    taxValue: Number(value.taxValue),
    discountType: value.discountState === "active" ? value.discountType : undefined,
    discountValue: Number(value.discountValue),
    employeeName: value.type === "salary" ? value.employeeName : undefined,
    otherLabel: value.type === "other" ? value.otherLabel : undefined,
  }));
