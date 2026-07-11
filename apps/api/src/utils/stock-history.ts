import {
  STOCK_EPSILON,
  StockLedgerConflictError,
  compareChronologicalStockEvents,
  roundStockQuantity,
} from "./stock-ledger-core.js";
import type { FifoStockDomain } from "./fifo-stock.js";

export type StockHistoryLayer = {
  id: number;
  domain: FifoStockDomain;
  itemId: number;
  sourceDocumentType: string;
  originalQuantity: number;
  occurredAt: Date | string;
};

export type StockHistoryAllocation = {
  id: number;
  domain: FifoStockDomain;
  itemId: number;
  outboundDocumentType: string;
  allocatedQuantity: number;
  occurredAt: Date | string;
};

type StockHistoryEvent = {
  id: number;
  occurredAt: Date | string;
  kind: string;
  delta: number;
};

// Replays every stock movement in chronological order and throws when any
// item's balance dips below zero at any point in time. This is what makes a
// backdated document that would retroactively over-consume stock fail instead
// of silently producing an impossible history.
export function validateChronologicalStockHistory(
  layers: StockHistoryLayer[],
  allocations: StockHistoryAllocation[],
) {
  const eventsByItem = new Map<string, StockHistoryEvent[]>();

  for (const layer of layers) {
    appendEvent(eventsByItem, layer.domain, layer.itemId, {
      id: layer.id,
      occurredAt: layer.occurredAt,
      kind: layer.sourceDocumentType,
      delta: layer.originalQuantity,
    });
  }

  for (const allocation of allocations) {
    appendEvent(eventsByItem, allocation.domain, allocation.itemId, {
      id: allocation.id,
      occurredAt: allocation.occurredAt,
      kind: allocation.outboundDocumentType,
      delta: -allocation.allocatedQuantity,
    });
  }

  for (const [key, events] of eventsByItem) {
    const ordered = [...events].sort(compareChronologicalStockEvents);
    const itemId = Number(key.slice(key.indexOf(":") + 1));
    let balance = 0;

    for (const event of ordered) {
      balance = roundStockQuantity(balance + event.delta);

      if (balance < -STOCK_EPSILON) {
        throw new StockLedgerConflictError(
          itemId,
          `Chronological stock balance goes negative for item ${itemId} at ${new Date(event.occurredAt).toISOString()}`,
        );
      }
    }
  }
}

function appendEvent(
  eventsByItem: Map<string, StockHistoryEvent[]>,
  domain: FifoStockDomain,
  itemId: number,
  event: StockHistoryEvent,
) {
  const key = `${domain}:${itemId}`;
  const events = eventsByItem.get(key) ?? [];
  events.push(event);
  eventsByItem.set(key, events);
}
