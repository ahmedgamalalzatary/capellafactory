import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";
import type { IngredientPurchaseLine } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";

export class IngredientPurchaseValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validateIngredientPurchaseLineUnit(
  unitFamily: IngredientUnitFamily,
  unit: IngredientPurchaseLine["unit"],
) {
  try {
    normalizeIngredientQuantity(unitFamily, 1, unit);
  } catch (error) {
    if (error instanceof Error) {
      throw new IngredientPurchaseValidationError(error.message);
    }

    throw error;
  }
}
