export const ingredientPurchaseUnits = ["kg", "g", "L", "ml", "piece"] as const;

export type IngredientPurchaseUnit = (typeof ingredientPurchaseUnits)[number];

export type IngredientPurchaseLineInput = {
  ingredientId: number;
  quantity: number;
  unit: IngredientPurchaseUnit;
  lineTotal: number;
};

export type IngredientPurchaseInput = {
  occurredAt: string;
  supplierId: number;
  notes?: string;
  lines: IngredientPurchaseLineInput[];
};

export type IngredientPurchaseLine = {
  id: number;
  ingredientId: number;
  quantity: number;
  unit: IngredientPurchaseUnit;
  unitPrice: number;
  lineTotal: number;
  normalizedQuantity: number;
};

export type IngredientPurchase = {
  id: number;
  invoiceCode: string;
  occurredAt: string;
  supplierId?: number;
  supplierName?: string;
  notes?: string;
  createdAt: string;
  lines: IngredientPurchaseLine[];
};
