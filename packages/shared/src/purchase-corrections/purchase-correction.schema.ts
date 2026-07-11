import { z } from "zod";
import { ingredientPurchaseUnitSchema } from "../ingredient-purchases/ingredient-purchase.schema.js";

const requiredTrimmedString = z.string().trim().min(1, "Reason is required");

export const purchaseCorrectionLineInputSchema = z.object({
  sourcePurchaseLineId: z.coerce.number().int().positive("Source purchase line is required"),
  quantity: z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر"),
}).strict();

export const purchaseCorrectionInputSchema = z.object({
  sourcePurchaseId: z.coerce.number().int().positive("Source purchase is required"),
  reason: requiredTrimmedString,
  lines: z.array(purchaseCorrectionLineInputSchema).min(1, "At least one correction line is required"),
}).strict().superRefine((value, ctx) => {
  const seenSourceLineIds = new Set<number>();

  value.lines.forEach((line, index) => {
    if (seenSourceLineIds.has(line.sourcePurchaseLineId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines", index, "sourcePurchaseLineId"],
        message: "لا يمكن تكرار سطر فاتورة الشراء المصدر في نفس التصحيح",
      });
      return;
    }

    seenSourceLineIds.add(line.sourcePurchaseLineId);
  });
});

export const purchaseCorrectionLineSchema = z.object({
  id: z.number().int().positive(),
  sourcePurchaseLineId: z.number().int().positive(),
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: ingredientPurchaseUnitSchema,
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  normalizedQuantity: z.number().nonnegative(),
});

export const purchaseCorrectionSchema = z.object({
  id: z.number().int().positive(),
  sourcePurchaseId: z.number().int().positive(),
  sourcePurchaseInvoiceCode: z.string().optional(),
  reason: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  lines: z.array(purchaseCorrectionLineSchema),
});
