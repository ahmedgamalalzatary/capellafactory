import { z } from "zod";
import { ingredientPurchaseUnits } from "./ingredient-purchase.types.js";
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

export const ingredientPurchaseUnitSchema = z.enum(ingredientPurchaseUnits);

export const ingredientPurchaseLineInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive("الخامة مطلوبة"),
  quantity: z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر"),
  unit: ingredientPurchaseUnitSchema,
  lineTotal: z.coerce.number().positive("إجمالي السطر يجب أن يكون أكبر من صفر"),
}).strict();

export const ingredientPurchaseInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "تاريخ المستند يجب أن يكون تاريخًا ووقتًا صالحين" }),
    supplierId: z.coerce.number().int().positive("المورد مطلوب"),
    notes: optionalTrimmedString,
    taxState: adjustmentStateSchema,
    taxType: adjustmentTypeSchema.optional(),
    taxValue: z.coerce.number(),
    discountState: adjustmentStateSchema,
    discountType: adjustmentTypeSchema.optional(),
    discountValue: z.coerce.number(),
    payments: documentPaymentsInputSchema,
    lines: z
      .array(ingredientPurchaseLineInputSchema)
      .min(1, "يجب إدخال سطر خامة واحد على الأقل"),
  })
  .strict()
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    validateDocumentAdjustments(value, ctx);

    const totalAmount = value.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const totals = calculateDocumentTotals(totalAmount, value);
    const paidAmount = sumDocumentPayments(value.payments);

    if (paidAmount > totals.finalTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payments"],
        message: "المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي",
      });
    }

    if ("supplierName" in value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplierName"],
        message: "يجب اختيار مورد مسجل للمشتريات",
      });
    }

    const seenIngredientIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenIngredientIds.has(line.ingredientId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "ingredientId"],
          message: "لا يمكن تكرار الخامة في نفس الفاتورة",
        });
        return;
      }

      seenIngredientIds.add(line.ingredientId);
    });

    if (totals.finalTotal < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "الإجمالي النهائي لا يمكن أن يكون سالبًا",
      });
    }
  })
  .transform((value) => ({
    ...value,
    taxType: value.taxState === "active" ? value.taxType : undefined,
    taxValue: Number(value.taxValue),
    discountType: value.discountState === "active" ? value.discountType : undefined,
    discountValue: Number(value.discountValue),
  }));
