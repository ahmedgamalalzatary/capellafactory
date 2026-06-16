import { PurchaseCorrectionValidationError } from "./purchase-corrections.validators.js";

export function resolvePurchaseCorrectionLineAmounts(input: {
  sourceQuantity: number;
  sourceLineTotal: number;
  correctionQuantity: number;
}) {
  if (input.sourceQuantity === 0) {
    throw new PurchaseCorrectionValidationError(
      "Source purchase line quantity must be greater than zero",
    );
  }

  const unitPrice = input.sourceLineTotal / input.sourceQuantity;

  return {
    unitPrice,
    lineTotal: unitPrice * input.correctionQuantity,
  };
}

export function buildPurchaseCorrectionAllocationRequest(input: {
  ingredientId: number;
  correctionId: number;
  correctionLineId: number;
  sourcePurchaseLineId: number;
  normalizedQuantity: number;
  occurredAt: Date;
}) {
  return {
    domain: "ingredient" as const,
    itemId: input.ingredientId,
    outboundDocumentType: "purchase-correction",
    outboundDocumentId: input.correctionId,
    outboundLineId: input.correctionLineId,
    sourceLineId: input.sourcePurchaseLineId,
    quantity: input.normalizedQuantity,
    occurredAt: input.occurredAt,
  };
}

export function buildPurchaseCorrectionAllocationRow(input: {
  correctionId: number;
  lineId: number;
  layerId: number;
  ingredientId: number;
  normalizedQuantity: number;
  lineTotal: number;
  occurredAt: Date;
}) {
  if (input.normalizedQuantity <= 0) {
    throw new PurchaseCorrectionValidationError(
      "Purchase correction line quantity must be greater than zero",
    );
  }

  return {
    domain: "ingredient" as const,
    itemId: input.ingredientId,
    outboundDocumentType: "purchase-correction",
    outboundDocumentId: input.correctionId,
    outboundLineId: input.lineId,
    stockLayerId: input.layerId,
    allocatedQuantity: input.normalizedQuantity.toFixed(3),
    unitCost: (input.lineTotal / input.normalizedQuantity).toFixed(6),
    allocatedCost: input.lineTotal.toFixed(3),
    occurredAt: input.occurredAt,
  };
}

export function getRemainingPurchaseCorrectionQuantity(
  sourceQuantity: number,
  previouslyCorrectedQuantity: number,
) {
  return sourceQuantity - previouslyCorrectedQuantity;
}
