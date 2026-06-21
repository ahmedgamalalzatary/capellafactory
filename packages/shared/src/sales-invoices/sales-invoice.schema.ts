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
  productId: z.coerce.number().int().positive("Product is required"),
  quantity: z.coerce.number().int("Quantity must be a whole number").positive("Quantity must be greater than zero"),
  sellingUnitPrice: z.coerce.number().positive("Selling unit price must be greater than zero"),
});

export const salesInvoiceInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "Occurred at must be a valid datetime" }),
    buyerId: z.coerce.number().int().positive("Buyer is required"),
    taxState: adjustmentStateSchema,
    taxType: adjustmentTypeSchema.optional(),
    taxValue: z.coerce.number(),
    discountState: adjustmentStateSchema,
    discountType: adjustmentTypeSchema.optional(),
    discountValue: z.coerce.number(),
    payments: documentPaymentsInputSchema,
    notes: optionalTrimmedString,
    lines: z.array(salesInvoiceLineInputSchema).min(1, "At least one product line is required"),
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
        message: "Paid amount cannot exceed total amount",
      });
    }

    const seenProductIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenProductIds.has(line.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "productId"],
          message: "Product cannot appear more than once in the same invoice",
        });
        return;
      }

      seenProductIds.add(line.productId);
    });

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
  }));
