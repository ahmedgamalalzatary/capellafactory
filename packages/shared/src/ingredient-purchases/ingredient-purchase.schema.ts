import { z } from "zod";
import { ingredientPurchaseUnits } from "./ingredient-purchase.types.js";

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
    supplierId: z.coerce.number().int().positive().optional(),
    supplierName: optionalTrimmedString,
    notes: optionalTrimmedString,
    lines: z
      .array(ingredientPurchaseLineInputSchema)
      .min(1, "At least one ingredient line is required"),
  })
  .transform((value) => ({
    ...value,
    supplierName: value.supplierName?.trim(),
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    const hasSupplierId = value.supplierId !== undefined;
    const hasSupplierName = Boolean(value.supplierName);

    if (hasSupplierId === hasSupplierName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasSupplierId ? ["supplierName"] : ["supplierId"],
        message: "Choose one supplier source: saved supplier or typed supplier name",
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
  });
