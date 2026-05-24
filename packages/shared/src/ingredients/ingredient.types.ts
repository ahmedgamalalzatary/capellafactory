export type IngredientUnitFamily = "weight" | "volume" | "count";
export type IngredientBaseUnit = "g" | "ml" | "piece";

export type Ingredient = {
  id: number;
  name: string;
  unitFamily: IngredientUnitFamily;
  baseUnit: IngredientBaseUnit;
  stockQuantity: number;
  hasHistory: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IngredientInput = {
  name: string;
  unitFamily: IngredientUnitFamily;
};
