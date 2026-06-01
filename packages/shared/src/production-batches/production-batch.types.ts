import type { IngredientPurchaseUnit } from "../ingredient-purchases/ingredient-purchase.types.js";

export type ProductionBatchIngredientLineInput = {
  ingredientId: number;
  quantity: number;
  unit: IngredientPurchaseUnit;
};

export type ProductionBatchInput = {
  occurredAt: string;
  productId: number;
  producedQuantity: number;
  notes?: string;
  lines: ProductionBatchIngredientLineInput[];
};

export type ProductionBatchIngredientLine = ProductionBatchIngredientLineInput & {
  id: number;
  normalizedQuantity: number;
  unitCost: number;
  lineCost: number;
};

export type ProductionBatch = {
  id: number;
  batchCode: string;
  occurredAt: string;
  productId: number;
  producedQuantity: number;
  totalCost: number;
  unitCost: number;
  notes?: string;
  createdAt: string;
  lines: ProductionBatchIngredientLine[];
};
