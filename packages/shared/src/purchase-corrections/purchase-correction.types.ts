export type PurchaseCorrectionLineInput = {
  sourcePurchaseLineId: number;
  quantity: number;
};

export type PurchaseCorrectionInput = {
  sourcePurchaseId: number;
  reason: string;
  lines: PurchaseCorrectionLineInput[];
};

export type PurchaseCorrectionLine = {
  id: number;
  sourcePurchaseLineId: number;
  ingredientId: number;
  quantity: number;
  unit: "kg" | "g" | "L" | "ml" | "piece";
  unitPrice: number;
  lineTotal: number;
  normalizedQuantity: number;
};

export type PurchaseCorrection = {
  id: number;
  sourcePurchaseId: number;
  sourcePurchaseInvoiceCode?: string;
  reason: string;
  createdAt: string;
  lines: PurchaseCorrectionLine[];
};
