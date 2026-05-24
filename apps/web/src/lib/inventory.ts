import type { Ingredient, IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";

export type IngredientUnitFilter = IngredientUnitFamily | "all";

export function normalizeIngredientUnitFilter(value?: string): IngredientUnitFilter {
  if (value === "weight" || value === "volume" || value === "count") {
    return value;
  }

  return "all";
}

export function filterIngredientsByUnitFamily(
  ingredients: Ingredient[],
  unitFilter: IngredientUnitFilter,
) {
  if (unitFilter === "all") {
    return ingredients;
  }

  return ingredients.filter((ingredient) => ingredient.unitFamily === unitFilter);
}
