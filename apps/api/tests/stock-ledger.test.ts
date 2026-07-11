import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFifoStatesFromLayers,
  compareChronologicalStockEvents,
  getFifoStockSnapshot,
  replayFifoStockEvents,
  StockLedgerConflictError,
  type FifoStockReplayEvent,
} from "../src/utils/stock-ledger.js";

test("fifo replay blocks a backdated event that drives a later record's stock negative", () => {
  // Purchase (+500) then a consumption (-500) that legitimately empties stock.
  // A backdated consumption (-300) ordered before the purchase leaves the
  // chronological replay without enough stock and must be rejected.
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-02T00:00:00.000Z",
      kind: "ingredient-purchase",
      ingredientId: 7,
      quantity: 500,
      cost: 50,
      sourceDocumentId: 11,
      sourceLineId: 101,
    },
    {
      id: 2,
      occurredAt: "2026-05-02T01:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 500,
      outboundDocumentId: 21,
      outboundLineId: 201,
    },
    {
      id: 3,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 300,
      outboundDocumentId: 22,
      outboundLineId: 202,
    },
  ];

  assert.throws(
    () => replayFifoStockEvents(events),
    (error: unknown) =>
      error instanceof StockLedgerConflictError && error.itemId === 7,
  );
});

test("fifo replay blocks consumption with no prior ingredient stock", () => {
  const events: FifoStockReplayEvent[] = [
    {
      id: 1,
      occurredAt: "2026-05-01T00:00:00.000Z",
      kind: "production-consumption",
      ingredientId: 7,
      quantity: 100,
      outboundDocumentId: 21,
      outboundLineId: 201,
    },
  ];

  assert.throws(
    () => replayFifoStockEvents(events),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
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
      error.message === "كمية الإدخال في مخزون FIFO يجب أن تكون أكبر من صفر لنوع شراء الخامات",
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
      error.message === "كمية الإدخال في مخزون FIFO يجب أن تكون أكبر من صفر لنوع إنتاج المنتجات",
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

test("chronological ordering breaks same-timestamp ties by event kind, not id", () => {
  // All four events share the exact same occurredAt. Replay must still be
  // deterministic: stock must arrive (purchase) before a correction adjusts it,
  // before it is consumed, before the produced output is added. The ids are
  // arranged to disagree with that order so the kind tie-break is what's tested.
  const sameInstant = "2026-05-10T00:00:00.000Z";
  const event = (id: number, kind: string) => ({ id, occurredAt: sameInstant, kind });

  const purchase = event(90, "ingredient-purchase");
  const correction = event(70, "purchase-correction");
  const consumption = event(50, "production-consumption");
  const output = event(30, "production-output");

  const shuffled = [output, consumption, correction, purchase];
  const ordered = [...shuffled].sort(compareChronologicalStockEvents);

  assert.deepEqual(
    ordered.map((e) => e.kind),
    [
      "ingredient-purchase",
      "purchase-correction",
      "production-consumption",
      "production-output",
    ],
  );

  // Same kind + same timestamp falls back to id order.
  assert.equal(
    compareChronologicalStockEvents(event(2, "ingredient-purchase"), event(5, "ingredient-purchase")) < 0,
    true,
  );

  // Different timestamps always win over kind weight.
  assert.equal(
    compareChronologicalStockEvents(
      { id: 1, occurredAt: "2026-05-11T00:00:00.000Z", kind: "ingredient-purchase" },
      { id: 2, occurredAt: "2026-05-10T00:00:00.000Z", kind: "production-output" },
    ) > 0,
    true,
  );
});
