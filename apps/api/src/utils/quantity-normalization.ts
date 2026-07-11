import type {
  IngredientPurchaseUnit,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";

const unitFamilyMap: Record<IngredientUnitFamily, readonly IngredientPurchaseUnit[]> = {
  weight: ["kg", "g"],
  volume: ["L", "ml"],
  count: ["piece"],
};

const unitFamilyLabels: Record<IngredientUnitFamily, string> = {
  weight: "الوزن",
  volume: "الحجم",
  count: "العدد",
};

export function normalizeIngredientQuantity(
  unitFamily: IngredientUnitFamily,
  quantity: number,
  unit: IngredientPurchaseUnit,
) {
  if (!unitFamilyMap[unitFamily].includes(unit)) {
    throw new Error(`الوحدة ${unit} غير صالحة لفئة الخامة ${unitFamilyLabels[unitFamily]}`);
  }

  if (unit === "kg" || unit === "L") {
    return quantity * 1000;
  }

  return quantity;
}
