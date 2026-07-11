import {
  STOCK_EPSILON,
  StockLedgerConflictError,
  roundStockQuantity,
} from "../../utils/stock-ledger.js";
import { PurchaseCorrectionValidationError } from "./purchase-corrections.validators.js";

export function applyPurchaseCorrectionToLayer(input: {
  ingredientId: number;
  layerRemainingQuantity: number;
  correctionQuantity: number;
}) {
  if (input.correctionQuantity > input.layerRemainingQuantity + STOCK_EPSILON) {
    throw new StockLedgerConflictError(
      input.ingredientId,
      `Insufficient remaining layer stock for ingredient ${input.ingredientId}`,
    );
  }

  return {
    nextRemainingQuantity: roundStockQuantity(
      input.layerRemainingQuantity - input.correctionQuantity,
    ),
  };
}

export function resolvePurchaseCorrectionLineAmounts(input: {
  sourceQuantity: number;
  sourceLineTotal: number;
  correctionQuantity: number;
}) {
  if (input.sourceQuantity === 0) {
    throw new PurchaseCorrectionValidationError(
      "كمية سطر فاتورة الشراء المصدر يجب أن تكون أكبر من صفر",
    );
  }

  const unitPrice = input.sourceLineTotal / input.sourceQuantity;

  return {
    unitPrice,
    lineTotal: unitPrice * input.correctionQuantity,
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
      "كمية سطر تصحيح الشراء يجب أن تكون أكبر من صفر",
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
