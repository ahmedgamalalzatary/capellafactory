export type StockLedgerBalances = Map<number, StockLedgerBalance>;

export type StockLedgerEntry = {
  itemId: number;
  quantityDelta: number;
  costDelta: number;
};

export type StockLedgerBalance = {
  quantity: number;
  totalCost: number;
};

export type StockLedgerSnapshot = StockLedgerBalance & {
  averageUnitCost: number;
  hasHistory: boolean;
  residualCost: number;
};

export function applyStockLedgerEntry(
  balances: StockLedgerBalances,
  entry: StockLedgerEntry,
) {
  const current = balances.get(entry.itemId) ?? { quantity: 0, totalCost: 0 };

  current.quantity += entry.quantityDelta;
  current.totalCost += entry.costDelta;

  balances.set(entry.itemId, current);
}

// Tolerance for floating-point drift when comparing replayed balances against
// zero. Quantities are normalized and stored to 3 decimals, so anything below
// this is rounding noise rather than a real negative balance.
const STOCK_EPSILON = 1e-6;

export type StockReplayEvent =
  | {
      id: number;
      occurredAt: Date | string;
      kind: "ingredient-purchase";
      ingredientId: number;
      quantity: number;
      cost: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-consumption";
      ingredientId: number;
      quantity: number;
      cost: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-output";
      productId: number;
      quantity: number;
      cost: number;
    };

// Raised when chronological replay drives an ingredient balance negative,
// meaning a (often backdated) stock-affecting record would leave a later record
// without enough stock. Callers translate this into a domain validation error.
export class StockLedgerConflictError extends Error {
  readonly ingredientId: number;

  constructor(ingredientId: number, message: string) {
    super(message);
    this.name = "StockLedgerConflictError";
    this.ingredientId = ingredientId;
  }
}

export function replayStockEvents(events: StockReplayEvent[]): {
  ingredientBalances: StockLedgerBalances;
  productBalances: StockLedgerBalances;
} {
  const ingredientBalances: StockLedgerBalances = new Map();
  const productBalances: StockLedgerBalances = new Map();

  const ordered = [...events].sort(compareStockReplayEvents);

  for (const event of ordered) {
    if (event.kind === "ingredient-purchase") {
      applyStockLedgerEntry(ingredientBalances, {
        itemId: event.ingredientId,
        quantityDelta: event.quantity,
        costDelta: event.cost,
      });
    } else if (event.kind === "production-consumption") {
      applyStockLedgerEntry(ingredientBalances, {
        itemId: event.ingredientId,
        quantityDelta: -event.quantity,
        costDelta: -event.cost,
      });

      const balance = ingredientBalances.get(event.ingredientId);

      if (balance && balance.quantity < -STOCK_EPSILON) {
        throw new StockLedgerConflictError(
          event.ingredientId,
          `Insufficient ingredient stock in chronological history for ingredient ${event.ingredientId}`,
        );
      }
    } else {
      applyStockLedgerEntry(productBalances, {
        itemId: event.productId,
        quantityDelta: event.quantity,
        costDelta: event.cost,
      });
    }
  }

  return { ingredientBalances, productBalances };
}

export function compareStockReplayEvents(left: StockReplayEvent, right: StockReplayEvent) {
  const leftTime = new Date(left.occurredAt).getTime();
  const rightTime = new Date(right.occurredAt).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  // Purchase and consumption/output ids come from independent sequences
  // (purchaseId vs batchId), so break ties by event kind first to keep the
  // replay deterministic: stock must arrive (purchase) before it is consumed,
  // and consumption before the produced output is added.
  const kindWeight = stockEventKindWeight(left.kind) - stockEventKindWeight(right.kind);

  if (kindWeight !== 0) {
    return kindWeight;
  }

  return left.id - right.id;
}

function stockEventKindWeight(kind: StockReplayEvent["kind"]) {
  switch (kind) {
    case "ingredient-purchase":
      return 0;
    case "production-consumption":
      return 1;
    case "production-output":
      return 2;
  }
}

export function getStockLedgerSnapshot(
  balances: StockLedgerBalances,
  itemId: number,
): StockLedgerSnapshot {
  const balance = balances.get(itemId);
  const rawQuantity = balance?.quantity ?? 0;
  const rawTotalCost = balance?.totalCost ?? 0;

  // Clamp to non-negative stock. When over-consumption/rounding drives quantity
  // to zero or below, zero out the carried cost but surface the leftover as
  // residualCost so it isn't silently lost.
  const quantity = Math.max(0, rawQuantity);
  const totalCost = rawQuantity > 0 ? rawTotalCost : 0;
  const residualCost = rawQuantity > 0 ? 0 : rawTotalCost;

  return {
    quantity,
    totalCost,
    averageUnitCost: quantity > 0 ? totalCost / quantity : 0,
    hasHistory: Boolean(balance),
    residualCost,
  };
}
