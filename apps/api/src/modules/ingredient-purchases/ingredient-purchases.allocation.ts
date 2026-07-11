import type {
  IngredientPurchaseInput,
  IngredientPurchaseLineInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import { IngredientPurchaseValidationError } from "./ingredient-purchases.validators.js";

export function resolveIngredientPurchaseSupplierFields(
  input: Pick<IngredientPurchaseInput, "supplierId">,
  savedSupplierName?: string,
) {
  return {
    supplierId: input.supplierId,
    supplierName: savedSupplierName,
  };
}

export function resolveIngredientPurchaseLineCost(
  line: Pick<IngredientPurchaseLineInput, "quantity" | "lineTotal">,
) {
  if (line.quantity <= 0) {
    throw new Error("كمية سطر الشراء يجب أن تكون أكبر من صفر");
  }
  return {
    unitPrice: line.lineTotal / line.quantity,
    lineTotal: line.lineTotal,
  };
}

export function buildIngredientPurchaseStockLayer(input: {
  purchaseId: number;
  purchaseLineId: number;
  ingredientId: number;
  normalizedQuantity: number;
  lineTotal: number;
  occurredAt: Date;
}) {
  if (input.normalizedQuantity <= 0) {
    throw new IngredientPurchaseValidationError(
      "كمية سطر شراء الخامة يجب أن تكون أكبر من صفر",
    );
  }

  return {
    domain: "ingredient" as const,
    itemId: input.ingredientId,
    sourceDocumentType: "ingredient-purchase",
    sourceDocumentId: input.purchaseId,
    sourceLineId: input.purchaseLineId,
    originalQuantity: input.normalizedQuantity.toFixed(3),
    remainingQuantity: input.normalizedQuantity.toFixed(3),
    unitCost: (input.lineTotal / input.normalizedQuantity).toFixed(6),
    totalCost: input.lineTotal.toFixed(3),
    occurredAt: input.occurredAt,
  };
}
