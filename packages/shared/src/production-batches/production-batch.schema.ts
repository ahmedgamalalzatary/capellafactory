import { z } from "zod";
import { ingredientPurchaseUnitSchema } from "../ingredient-purchases/ingredient-purchase.schema.js";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const productionBatchLineInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive("Ingredient is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: ingredientPurchaseUnitSchema,
});

export const productionBatchInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "Occurred at must be a valid datetime" }),
    productId: z.coerce.number().int().positive("Product is required"),
    producedQuantity: z.coerce.number().positive("Produced quantity must be greater than zero"),
    notes: optionalTrimmedString,
    lines: z
      .array(productionBatchLineInputSchema)
      .min(1, "At least one ingredient line is required"),
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
          message: "Ingredient cannot appear more than once in the same batch",
        });
        return;
      }

      seenIngredientIds.add(line.ingredientId);
    });
  });
