import type { IngredientUnitFamily } from "@capella/shared/ingredients/ingredient.types";
import type { ProductionBatchIngredientLine } from "@capella/shared/production-batches/production-batch.types";
import { normalizeIngredientQuantity } from "../../utils/quantity-normalization.js";
import type { ProductionBatchStockCheck } from "./production-batches.types.js";

export class ProductionBatchValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function formatStockQuantity(value: number) {
  return parseFloat(value.toFixed(3)).toString();
}

export function validateProductionBatchStock(checks: ProductionBatchStockCheck[]) {
  const shortages = checks.filter((check) => check.requestedQuantity > check.availableQuantity);

  if (shortages.length === 0) {
    return;
  }

  const details = shortages
    .map(
      (check) =>
        `${check.ingredientName} (متاح ${formatStockQuantity(check.availableQuantity)}، مطلوب ${formatStockQuantity(check.requestedQuantity)})`,
    )
    .join("؛ ");

  throw new ProductionBatchValidationError(`المخزون غير كافٍ من: ${details}`);
}

export function validateProductionBatchLineUnit(
  unitFamily: IngredientUnitFamily,
  unit: ProductionBatchIngredientLine["unit"],
) {
  try {
    normalizeIngredientQuantity(unitFamily, 1, unit);
  } catch (error) {
    if (error instanceof Error) {
      throw new ProductionBatchValidationError(error.message);
    }

    throw error;
  }
}
