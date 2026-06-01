import type {
  IngredientPurchaseUnit,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";

const unitFamilyMap: Record<IngredientUnitFamily, readonly IngredientPurchaseUnit[]> = {
  weight: ["kg", "g"],
  volume: ["L", "ml"],
  count: ["piece"],
};

export function normalizeIngredientQuantity(
  unitFamily: IngredientUnitFamily,
  quantity: number,
  unit: IngredientPurchaseUnit,
) {
  if (!unitFamilyMap[unitFamily].includes(unit)) {
    throw new Error(`Unit ${unit} is not valid for ingredient family ${unitFamily}`);
  }

  if (unit === "kg" || unit === "L") {
    return quantity * 1000;
  }

  return quantity;
}
