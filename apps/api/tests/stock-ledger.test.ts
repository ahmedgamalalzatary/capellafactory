import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStockLedgerEntry,
  getStockLedgerSnapshot,
  replayStockEvents,
  StockLedgerConflictError,
  type StockLedgerBalances,
  type StockReplayEvent,
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
    residualCost: 0,
  });
});

test("returns an empty snapshot when an item has no ledger history", () => {
  const balances: StockLedgerBalances = new Map();

  assert.deepEqual(getStockLedgerSnapshot(balances, 8), {
    quantity: 0,
    totalCost: 0,
    averageUnitCost: 0,
    hasHistory: false,
    residualCost: 0,
  });
});

test("replays events chronologically and returns final balances", () => {
  const events: StockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 1000,
      cost: 50,
    },
    {
      id: 1,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 400,
      cost: 20,
    },
    {
      id: 1,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "production-output",
      productId: 3,
      quantity: 10,
      cost: 20,
    },
  ];

  const { ingredientBalances, productBalances } = replayStockEvents(events);

  assert.deepEqual(getStockLedgerSnapshot(ingredientBalances, 7), {
    quantity: 600,
    totalCost: 30,
    averageUnitCost: 0.05,
    hasHistory: true,
    residualCost: 0,
  });
  assert.deepEqual(getStockLedgerSnapshot(productBalances, 3), {
    quantity: 10,
    totalCost: 20,
    averageUnitCost: 2,
    hasHistory: true,
    residualCost: 0,
  });
});

test("blocks a backdated batch that drives a later record's stock negative", () => {
  // Purchase (+1000) then a consumption (-1000) that legitimately empties stock.
  // A backdated consumption (-500) inserted between them makes the later
  // consumption over-consume: the chronological replay must reject it.
  const events: StockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 1000,
      cost: 50,
    },
    {
      id: 5,
      occurredAt: "2026-05-05T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 1000,
      cost: 50,
    },
    {
      id: 9,
      occurredAt: "2026-05-03T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 500,
      cost: 25,
    },
  ];

  assert.throws(
    () => replayStockEvents(events),
    (error: unknown) =>
      error instanceof StockLedgerConflictError && error.ingredientId === 7,
  );
});

test("blocks consumption with no prior ingredient stock", () => {
  const events: StockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 100,
      cost: 5,
    },
  ];

  assert.throws(
    () => replayStockEvents(events),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
});
