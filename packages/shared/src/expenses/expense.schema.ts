import { z } from "zod";
import { expenseTypes } from "./expense.types.js";
import { paymentMethodSchema } from "../payments/payment.schema.js";

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
    paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
    paymentMethod: paymentMethodSchema.optional(),
    paidAt: z.string().datetime({ offset: true }).optional(),
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
    if (value.paidAmount > value.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paidAmount"],
        message: "Paid amount cannot exceed total amount",
      });
    }

    if (value.paidAmount > 0 && !value.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Payment method is required when paid amount is greater than zero",
      });
    }

    if (value.paidAmount > 0 && !value.paidAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paidAt"],
        message: "Payment date is required when paid amount is greater than zero",
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
  })
  .transform((value) => ({
    ...value,
    paymentMethod: value.paidAmount > 0 ? value.paymentMethod : undefined,
    paidAt: value.paidAmount > 0 ? value.paidAt : undefined,
    employeeName: value.type === "salary" ? value.employeeName : undefined,
    otherLabel: value.type === "other" ? value.otherLabel : undefined,
  }));
