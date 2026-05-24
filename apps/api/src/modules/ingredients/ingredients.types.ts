import type { Ingredient, IngredientInput } from "@capella/shared/ingredients/ingredient.types";

export type IngredientRecord = Ingredient;
export type CreateIngredientInput = IngredientInput;
export type UpdateIngredientInput = Partial<
  IngredientInput & {
    isArchived: boolean;
  }
>;
