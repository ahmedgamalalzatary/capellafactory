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
