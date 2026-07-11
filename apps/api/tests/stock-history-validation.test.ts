import test from "node:test";
import assert from "node:assert/strict";
import {
  StockLedgerConflictError,
  validateChronologicalStockHistory,
} from "../src/utils/stock-ledger.js";

// The ledger must reject histories where, replayed in time order, any item's
// balance goes negative — e.g. a backdated batch consuming stock that had not
// arrived yet at that date.

function purchaseLayer(input: {
  id: number;
  itemId: number;
  quantity: number;
  occurredAt: string;
}) {
  return {
    id: input.id,
    domain: "ingredient" as const,
    itemId: input.itemId,
    sourceDocumentType: "ingredient-purchase",
    originalQuantity: input.quantity,
    occurredAt: input.occurredAt,
  };
}

function consumptionAllocation(input: {
  id: number;
  itemId: number;
  quantity: number;
  occurredAt: string;
}) {
  return {
    id: input.id,
    domain: "ingredient" as const,
    itemId: input.itemId,
    outboundDocumentType: "production-consumption",
    allocatedQuantity: input.quantity,
    occurredAt: input.occurredAt,
  };
}

test("accepts a history where stock always arrives before it is consumed", () => {
  assert.doesNotThrow(() =>
    validateChronologicalStockHistory(
      [purchaseLayer({ id: 1, itemId: 3, quantity: 100, occurredAt: "2026-01-01T10:00:00.000Z" })],
      [
        consumptionAllocation({
          id: 1,
          itemId: 3,
          quantity: 60,
          occurredAt: "2026-01-02T10:00:00.000Z",
        }),
      ],
    ),
  );
});

test("rejects a backdated consumption that happens before any stock existed", () => {
  assert.throws(
    () =>
      validateChronologicalStockHistory(
        [purchaseLayer({ id: 1, itemId: 3, quantity: 100, occurredAt: "2026-03-01T10:00:00.000Z" })],
        [
          consumptionAllocation({
            id: 1,
            itemId: 3,
            quantity: 60,
            occurredAt: "2026-01-02T10:00:00.000Z",
          }),
        ],
      ),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
});

test("rejects a history that only balances thanks to stock purchased later", () => {
  assert.throws(
    () =>
      validateChronologicalStockHistory(
        [
          purchaseLayer({ id: 1, itemId: 3, quantity: 50, occurredAt: "2026-01-01T10:00:00.000Z" }),
          purchaseLayer({ id: 2, itemId: 3, quantity: 50, occurredAt: "2026-03-01T10:00:00.000Z" }),
        ],
        [
          consumptionAllocation({
            id: 1,
            itemId: 3,
            quantity: 80,
            occurredAt: "2026-02-01T10:00:00.000Z",
          }),
        ],
      ),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
});

test("rejects a product sale dated before the production batch that made the product", () => {
  assert.throws(
    () =>
      validateChronologicalStockHistory(
        [
          {
            id: 1,
            domain: "product",
            itemId: 7,
            sourceDocumentType: "production-output",
            originalQuantity: 10,
            occurredAt: "2026-02-01T10:00:00.000Z",
          },
        ],
        [
          {
            id: 1,
            domain: "product",
            itemId: 7,
            outboundDocumentType: "sales-invoice",
            allocatedQuantity: 5,
            occurredAt: "2026-01-15T10:00:00.000Z",
          },
        ],
      ),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
});

test("counts same-instant arrivals before same-instant consumption", () => {
  assert.doesNotThrow(() =>
    validateChronologicalStockHistory(
      [purchaseLayer({ id: 5, itemId: 3, quantity: 20, occurredAt: "2026-01-01T10:00:00.000Z" })],
      [
        consumptionAllocation({
          id: 9,
          itemId: 3,
          quantity: 20,
          occurredAt: "2026-01-01T10:00:00.000Z",
        }),
      ],
    ),
  );
});

test("counts same-instant positive events before negative events regardless of kind", () => {
  assert.doesNotThrow(() =>
    validateChronologicalStockHistory(
      [
        {
          id: 9,
          domain: "ingredient",
          itemId: 3,
          sourceDocumentType: "production-output",
          originalQuantity: 20,
          occurredAt: "2026-01-01T10:00:00.000Z",
        },
      ],
      [
        {
          id: 1,
          domain: "ingredient",
          itemId: 3,
          outboundDocumentType: "purchase-correction",
          allocatedQuantity: 20,
          occurredAt: "2026-01-01T10:00:00.000Z",
        },
      ],
    ),
  );
});

test("keeps ingredient and product balances independent per item", () => {
  assert.throws(
    () =>
      validateChronologicalStockHistory(
      [
        purchaseLayer({ id: 1, itemId: 3, quantity: 100, occurredAt: "2026-01-01T10:00:00.000Z" }),
        {
          id: 2,
          domain: "product",
          itemId: 3,
          sourceDocumentType: "production-output",
          originalQuantity: 5,
          occurredAt: "2026-01-02T10:00:00.000Z",
        },
      ],
      [
        {
          id: 1,
          domain: "product",
          itemId: 3,
          outboundDocumentType: "sales-invoice",
          allocatedQuantity: 6,
          occurredAt: "2026-01-03T10:00:00.000Z",
        },
      ],
      ),
    (error: unknown) => error instanceof StockLedgerConflictError,
  );
});
