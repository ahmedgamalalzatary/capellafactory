import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStockLedgerEntry,
  getStockLedgerSnapshot,
  type StockLedgerBalances,
} from "../src/utils/stock-ledger.js";

test("applies inbound stock entries to quantity and total cost", () => {
  const balances: StockLedgerBalances = new Map();

  applyStockLedgerEntry(balances, {
    itemId: 3,
    quantityDelta: 2500,
    costDelta: 113.125,
  });

  assert.deepEqual(getStockLedgerSnapshot(balances, 3), {
    quantity: 2500,
    totalCost: 113.125,
    averageUnitCost: 0.04525,
    hasHistory: true,
  });
});

test("returns an empty snapshot when an item has no ledger history", () => {
  const balances: StockLedgerBalances = new Map();

  assert.deepEqual(getStockLedgerSnapshot(balances, 8), {
    quantity: 0,
    totalCost: 0,
    averageUnitCost: 0,
    hasHistory: false,
  });
});
