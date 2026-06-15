import test from "node:test";
import assert from "node:assert/strict";
import {
  getStockLedgerSnapshot,
  replayStockEvents,
  StockLedgerConflictError,
  type StockReplayEvent,
} from "../src/utils/stock-ledger.js";

test("rejects a backdated batch whose replay over-consumes", () => {
  const events: StockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 500,
      cost: 50,
    },
    {
      id: 2,
      occurredAt: "2026-05-02T01:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 500,
      cost: 50,
    },
    {
      id: 3,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 300,
      cost: 30,
    },
  ];

  assert.throws(
    () => replayStockEvents(events),
    (error: unknown) =>
      error instanceof StockLedgerConflictError && error.ingredientId === 7,
  );
});

test("commits a valid batch and reduces ingredient stock in chronological replay", () => {
  const events: StockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 500,
      cost: 50,
    },
    {
      id: 2,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 200,
      cost: 20,
    },
    {
      id: 3,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "production-output",
      productId: 3,
      quantity: 100,
      cost: 20,
    },
  ];

  const { ingredientBalances, productBalances } = replayStockEvents(events);

  assert.deepEqual(getStockLedgerSnapshot(ingredientBalances, 7), {
    quantity: 300,
    totalCost: 30,
    averageUnitCost: 0.1,
    hasHistory: true,
    residualCost: 0,
  });
  assert.deepEqual(getStockLedgerSnapshot(productBalances, 3), {
    quantity: 100,
    totalCost: 20,
    averageUnitCost: 0.2,
    hasHistory: true,
    residualCost: 0,
  });
});
