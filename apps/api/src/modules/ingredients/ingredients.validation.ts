import { z } from "zod";
import { ingredientInputSchema } from "@capella/shared/ingredients/ingredient.schema";

export const createIngredientSchema = ingredientInputSchema;
export const updateIngredientSchema = ingredientInputSchema
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
  });
