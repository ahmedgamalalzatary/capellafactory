import { z } from "zod";
import { paymentInputSchema } from "./payment.schema.js";
import {
  adjustmentStates,
  adjustmentTypes,
  type DocumentAdjustmentsInput,
  type DocumentTotals,
} from "./document-payment.types.js";

export const adjustmentStateSchema = z.enum(adjustmentStates);
export const adjustmentTypeSchema = z.enum(adjustmentTypes);

const percentageValueSchema = z
  .number()
  .min(0, "Percentage must be at least zero")
  .max(100, "Percentage cannot exceed 100");

const amountValueSchema = z.number().min(0, "Amount must be at least zero");

export const documentPaymentsInputSchema = z.array(paymentInputSchema);

export const documentAdjustmentsInputSchema: z.ZodType<DocumentAdjustmentsInput> = z
  .object({
    taxState: adjustmentStateSchema,
    taxType: adjustmentTypeSchema.optional(),
    taxValue: z.coerce.number(),
    discountState: adjustmentStateSchema,
    discountType: adjustmentTypeSchema.optional(),
    discountValue: z.coerce.number(),
  })
  .superRefine((value, ctx) => {
    validateAdjustment("tax", value.taxState, value.taxType, value.taxValue, ctx);
    validateAdjustment(
      "discount",
      value.discountState,
      value.discountType,
      value.discountValue,
      ctx,
    );
  })
  .transform((value) => ({
    taxState: value.taxState,
    taxType: value.taxState === "active" ? value.taxType : undefined,
    taxValue: Number(value.taxValue ?? 0),
    discountState: value.discountState,
    discountType: value.discountState === "active" ? value.discountType : undefined,
    discountValue: Number(value.discountValue ?? 0),
  }));

function validateAdjustment(
  kind: "tax" | "discount",
  state: "active" | "inactive",
  type: "amount" | "percentage" | undefined,
  value: number,
  ctx: z.RefinementCtx,
) {
  const typeLabel = kind === "tax" ? "Tax" : "Discount";

  if (state === "inactive") {
    if (type !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [`${kind}Type`],
        message: `${typeLabel} type must be empty when ${kind} is inactive`,
      });
    }
    return;
  }

  if (!type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [`${kind}Type`],
      message: `${typeLabel} type is required when ${kind} is active`,
    });
    return;
  }

  const result =
    type === "percentage"
      ? percentageValueSchema.safeParse(value)
      : amountValueSchema.safeParse(value);

  if (!result.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [`${kind}Value`],
      message: result.error.issues[0]?.message ?? `Invalid ${kind} value`,
    });
  }
}

export function validateDocumentAdjustments(
  adjustments: DocumentAdjustmentsInput,
  ctx: z.RefinementCtx,
) {
  const result = documentAdjustmentsInputSchema.safeParse(adjustments);

  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  }
}

export function calculateDocumentTotals(
  baseTotal: number,
  adjustments: DocumentAdjustmentsInput,
): DocumentTotals {
  const taxAmount =
    adjustments.taxState === "active"
      ? adjustments.taxType === "percentage"
        ? (baseTotal * adjustments.taxValue) / 100
        : adjustments.taxValue
      : 0;
  const totalAfterTax = baseTotal + taxAmount;
  const discountAmount =
    adjustments.discountState === "active"
      ? adjustments.discountType === "percentage"
        ? (totalAfterTax * adjustments.discountValue) / 100
        : adjustments.discountValue
      : 0;
  const finalTotal = totalAfterTax - discountAmount;

  return {
    baseTotal,
    taxAmount,
    totalAfterTax,
    discountAmount,
    finalTotal,
  };
}

export function sumDocumentPayments(payments: Array<{ amount: number }>) {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}
