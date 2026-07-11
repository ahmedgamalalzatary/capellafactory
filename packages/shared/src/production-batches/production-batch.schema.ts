import { z } from "zod";
import { ingredientPurchaseUnitSchema } from "../ingredient-purchases/ingredient-purchase.schema.js";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const productionBatchLineInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive("الخامة مطلوبة"),
  quantity: z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر"),
  unit: ingredientPurchaseUnitSchema,
});

export const productionBatchInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "تاريخ المستند يجب أن يكون تاريخًا ووقتًا صالحين" }),
    productId: z.coerce.number().int().positive("المنتج مطلوب"),
    producedQuantity: z.coerce.number().positive("كمية الإنتاج يجب أن تكون أكبر من صفر"),
    notes: optionalTrimmedString,
    lines: z
      .array(productionBatchLineInputSchema)
      .min(1, "يجب إدخال سطر خامة واحد على الأقل"),
  })
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    const seenIngredientIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenIngredientIds.has(line.ingredientId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "ingredientId"],
          message: "لا يمكن تكرار الخامة في نفس التشغيلة",
        });
        return;
      }

      seenIngredientIds.add(line.ingredientId);
    });
  });
