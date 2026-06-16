export class PurchaseCorrectionValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validatePurchaseCorrectionQuantity(input: {
  ingredientName: string;
  requestedQuantity: number;
  remainingQuantity: number;
}) {
  if (input.requestedQuantity > input.remainingQuantity) {
    throw new PurchaseCorrectionValidationError(
      `Correction quantity exceeds remaining reversible quantity for ${input.ingredientName}`,
    );
  }
}
