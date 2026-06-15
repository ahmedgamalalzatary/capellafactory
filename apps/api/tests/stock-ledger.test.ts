import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStockLedgerEntry,
  buildFifoStatesFromLayers,
  getFifoStockSnapshot,
  getStockLedgerSnapshot,
  replayFifoStockEvents,
  replayStockEvents,
  StockLedgerConflictError,
  type StockLedgerBalances,
  type FifoStockReplayEvent,
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

test("replays purchase corrections as negative ingredient stock events", () => {
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
      id: 2,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "purchase-correction",
      ingredientId: 7,
      quantity: 200,
      cost: 10,
    },
  ];

  const { ingredientBalances } = replayStockEvents(events);

  assert.deepEqual(getStockLedgerSnapshot(ingredientBalances, 7), {
    quantity: 800,
    totalCost: 40,
    averageUnitCost: 0.05,
    hasHistory: true,
    residualCost: 0,
  });
});

test("fifo replay consumes the oldest ingredient layers first", () => {
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 1000,
      cost: 50,
      sourceDocumentId: 11,
      sourceLineId: 101,
    },
    {
      id: 2,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 500,
      cost: 35,
      sourceDocumentId: 12,
      sourceLineId: 102,
    },
    {
      id: 3,
      occurredAt: "2026-05-03T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 1200,
      outboundDocumentId: 21,
      outboundLineId: 201,
    },
  ];

  const replay = replayFifoStockEvents(events);

  assert.deepEqual(
    replay.allocations.map((allocation) => ({
      stockLayerId: allocation.stockLayerId,
      quantity: allocation.allocatedQuantity,
      cost: allocation.allocatedCost,
    })),
    [
      { stockLayerId: 1, quantity: 1000, cost: 50 },
      { stockLayerId: 2, quantity: 200, cost: 14 },
    ],
  );

  assert.deepEqual(getFifoStockSnapshot(replay.ingredientStates, 7), {
    quantity: 300,
    totalCost: 21,
    averageUnitCost: 0.07,
    hasHistory: true,
    layerCount: 1,
  });
});

test("fifo purchase correction consumes only its linked purchase layer", () => {
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 1000,
      cost: 50,
      sourceDocumentId: 11,
      sourceLineId: 101,
    },
    {
      id: 2,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 500,
      cost: 35,
      sourceDocumentId: 12,
      sourceLineId: 102,
    },
    {
      id: 3,
      occurredAt: "2026-05-03T00:00:00.000Z",
      kind: "purchase-correction",
      ingredientId: 7,
      quantity: 200,
      outboundDocumentId: 31,
      outboundLineId: 301,
      sourceLineId: 102,
    },
  ];

  const replay = replayFifoStockEvents(events);

  assert.deepEqual(
    replay.allocations.map((allocation) => ({
      stockLayerId: allocation.stockLayerId,
      quantity: allocation.allocatedQuantity,
      cost: allocation.allocatedCost,
    })),
    [{ stockLayerId: 2, quantity: 200, cost: 14 }],
  );

  assert.deepEqual(getFifoStockSnapshot(replay.ingredientStates, 7), {
    quantity: 1300,
    totalCost: 71,
    averageUnitCost: 0.054615,
    hasHistory: true,
    layerCount: 2,
  });
});

test("fifo replay rejects ingredient purchase events with zero quantity", () => {
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 0,
      cost: 50,
      sourceDocumentId: 11,
      sourceLineId: 101,
    },
  ];

  assert.throws(
    () => replayFifoStockEvents(events),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "FIFO inbound quantity must be greater than zero for ingredient-purchase",
  );
});

test("fifo replay rejects production output events with zero quantity", () => {
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "production-output",
      productId: 3,
      quantity: 0,
      cost: 20,
      sourceDocumentId: 41,
      sourceLineId: 401,
    },
  ];

  assert.throws(
    () => replayFifoStockEvents(events),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "FIFO inbound quantity must be greater than zero for production-output",
  );
});

test("builds fifo summary state from persisted layers including consumed history", () => {
  const states = buildFifoStatesFromLayers([
    {
      id: 1,
      domain: "ingredient",
      itemId: 7,
      sourceDocumentType: "ingredient-purchase",
      sourceDocumentId: 11,
      sourceLineId: 101,
      originalQuantity: 1000,
      remainingQuantity: 0,
      unitCost: 0.05,
      totalCost: 50,
      occurredAt: "2026-05-01T00:00:00.000Z",
    },
    {
      id: 2,
      domain: "ingredient",
      itemId: 7,
      sourceDocumentType: "ingredient-purchase",
      sourceDocumentId: 12,
      sourceLineId: 102,
      originalQuantity: 500,
      remainingQuantity: 300,
      unitCost: 0.07,
      totalCost: 35,
      occurredAt: "2026-05-02T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(getFifoStockSnapshot(states, 7), {
    quantity: 300,
    totalCost: 21,
    averageUnitCost: 0.07,
    hasHistory: true,
    layerCount: 1,
  });
});
