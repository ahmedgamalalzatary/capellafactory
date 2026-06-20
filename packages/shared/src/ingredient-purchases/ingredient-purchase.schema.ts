import { z } from "zod";
import { ingredientPurchaseUnits } from "./ingredient-purchase.types.js";
import { paymentMethodSchema } from "../payments/payment.schema.js";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const ingredientPurchaseUnitSchema = z.enum(ingredientPurchaseUnits);

export const ingredientPurchaseLineInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive("Ingredient is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: ingredientPurchaseUnitSchema,
  lineTotal: z.coerce.number().positive("Line total must be greater than zero"),
}).strict();

export const ingredientPurchaseInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "Occurred at must be a valid datetime" }),
    supplierId: z.coerce.number().int().positive("Supplier is required"),
    paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
    paymentMethod: paymentMethodSchema.optional(),
    paidAt: z.string().datetime({ offset: true }).optional(),
    notes: optionalTrimmedString,
    lines: z
      .array(ingredientPurchaseLineInputSchema)
      .min(1, "At least one ingredient line is required"),
  })
  .strict()
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    const totalAmount = value.lines.reduce((sum, line) => sum + line.lineTotal, 0);

    if (value.paidAmount > totalAmount) {
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

    if ("supplierName" in value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplierName"],
        message: "Ingredient purchases must use a saved supplier",
      });
    }

    const seenIngredientIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenIngredientIds.has(line.ingredientId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "ingredientId"],
          message: "Ingredient cannot appear more than once in the same invoice",
        });
        return;
      }

      seenIngredientIds.add(line.ingredientId);
    });
  })
  .transform((value) => ({
    ...value,
    paymentMethod: value.paidAmount > 0 ? value.paymentMethod : undefined,
    paidAt: value.paidAmount > 0 ? value.paidAt : undefined,
  }));
