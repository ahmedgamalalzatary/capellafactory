import { z } from "zod";
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

export const salesInvoiceLineInputSchema = z.object({
  productId: z.coerce.number().int().positive("المنتج مطلوب"),
  quantity: z.coerce.number().int("الكمية يجب أن تكون عددًا صحيحًا").positive("الكمية يجب أن تكون أكبر من صفر"),
  sellingUnitPrice: z.coerce.number().positive("سعر بيع الوحدة يجب أن يكون أكبر من صفر"),
});

export const salesInvoiceInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "تاريخ المستند يجب أن يكون تاريخًا ووقتًا صالحين" }),
    buyerId: z.coerce.number().int().positive("العميل مطلوب"),
    taxState: adjustmentStateSchema,
    taxType: adjustmentTypeSchema.optional(),
    taxValue: z.coerce.number(),
    discountState: adjustmentStateSchema,
    discountType: adjustmentTypeSchema.optional(),
    discountValue: z.coerce.number(),
    payments: documentPaymentsInputSchema,
    notes: optionalTrimmedString,
    lines: z.array(salesInvoiceLineInputSchema).min(1, "يجب إدخال سطر منتج واحد على الأقل"),
  })
  .strict()
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    validateDocumentAdjustments(value, ctx);

    const subtotal = value.lines.reduce(
      (sum, line) => sum + line.quantity * line.sellingUnitPrice,
      0,
    );
    const totals = calculateDocumentTotals(subtotal, value);
    const paidAmount = sumDocumentPayments(value.payments);

    if (paidAmount > totals.finalTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payments"],
        message: "المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي",
      });
    }

    const seenProductIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenProductIds.has(line.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "productId"],
          message: "لا يمكن تكرار المنتج في نفس الفاتورة",
        });
        return;
      }

      seenProductIds.add(line.productId);
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
