// Tolerance for floating-point drift when comparing replayed balances against
// zero. Quantities are normalized and stored to 3 decimals, so anything below
// this is rounding noise rather than a real negative balance.
export const STOCK_EPSILON = 1e-6;

// Raised when chronological replay drives an ingredient balance negative,
// meaning a (often backdated) stock-affecting record would leave a later record
// without enough stock. Callers translate this into a domain validation error.
export class StockLedgerConflictError extends Error {
  readonly itemId: number;

  constructor(itemId: number, message: string) {
    super(message);
    this.name = "StockLedgerConflictError";
    this.itemId = itemId;
  }
}

export function compareChronologicalStockEvents(
  left: { id: number; occurredAt: Date | string; kind: string; delta?: number },
  right: { id: number; occurredAt: Date | string; kind: string; delta?: number },
) {
  const leftTime = new Date(left.occurredAt).getTime();
  const rightTime = new Date(right.occurredAt).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  const deltaWeight = stockDeltaWeight(left.delta) - stockDeltaWeight(right.delta);

  if (deltaWeight !== 0) {
    return deltaWeight;
  }

  // Purchase and consumption/output ids come from independent sequences
  // (purchaseId vs batchId), so use event kind before ids as a stable tie-breaker.
  const kindWeight = stockEventKindWeight(left.kind) - stockEventKindWeight(right.kind);

  if (kindWeight !== 0) {
    return kindWeight;
  }

  return left.id - right.id;
}

function stockDeltaWeight(delta: number | undefined) {
  if (typeof delta !== "number") {
    return 1;
  }

  return delta > 0 ? 0 : delta < 0 ? 2 : 1;
}

function stockEventKindWeight(kind: string) {
  switch (kind) {
    case "ingredient-purchase":
      return 0;
    case "purchase-correction":
      return 1;
    case "production-consumption":
      return 2;
    case "production-output":
      return 3;
    default:
      return 99;
  }
}

export function roundStockQuantity(value: number) {
  return Number(value.toFixed(3));
}

export function roundStockCost(value: number) {
  return Number(value.toFixed(3));
}
