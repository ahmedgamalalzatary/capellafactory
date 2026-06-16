import {
  STOCK_EPSILON,
  StockLedgerConflictError,
  compareChronologicalStockEvents,
  roundStockCost,
  roundStockQuantity,
} from "./stock-ledger-core.js";

export type FifoStockDomain = "ingredient" | "product";

export type FifoStockLayer = {
  id: number;
  domain: FifoStockDomain;
  itemId: number;
  sourceDocumentType: string;
  sourceDocumentId: number;
  sourceLineId?: number;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  totalCost: number;
  occurredAt: Date | string;
};

export type FifoStockAllocation = {
  id: number;
  domain: FifoStockDomain;
  itemId: number;
  outboundDocumentType: string;
  outboundDocumentId: number;
  outboundLineId?: number;
  stockLayerId: number;
  allocatedQuantity: number;
  unitCost: number;
  allocatedCost: number;
  occurredAt: Date | string;
};

type FifoStockState = {
  hasHistory: boolean;
  openLayers: FifoStockLayer[];
};

export type FifoStockStates = Map<number, FifoStockState>;

export type FifoStockReplayEvent =
  | {
      id: number;
      occurredAt: Date | string;
      kind: "ingredient-purchase";
      ingredientId: number;
      quantity: number;
      cost: number;
      sourceDocumentId: number;
      sourceLineId?: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-consumption";
      ingredientId: number;
      quantity: number;
      outboundDocumentId: number;
      outboundLineId?: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "purchase-correction";
      ingredientId: number;
      quantity: number;
      outboundDocumentId: number;
      outboundLineId?: number;
      sourceLineId?: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-output";
      productId: number;
      quantity: number;
      cost: number;
      sourceDocumentId: number;
      sourceLineId?: number;
    };

function validatePositiveFifoInboundQuantity(kind: "ingredient-purchase" | "production-output", quantity: number) {
  if (quantity <= 0) {
    throw new Error(`FIFO inbound quantity must be greater than zero for ${kind}`);
  }
}

export function replayFifoStockEvents(events: FifoStockReplayEvent[]): {
  ingredientStates: FifoStockStates;
  productStates: FifoStockStates;
  layers: FifoStockLayer[];
  allocations: FifoStockAllocation[];
} {
  const ingredientStates: FifoStockStates = new Map();
  const productStates: FifoStockStates = new Map();
  const layers: FifoStockLayer[] = [];
  const allocations: FifoStockAllocation[] = [];

  const ordered = [...events].sort(compareChronologicalStockEvents);
  let nextLayerId = 1;
  let nextAllocationId = 1;

  for (const event of ordered) {
    if (event.kind === "ingredient-purchase") {
      validatePositiveFifoInboundQuantity(event.kind, event.quantity);
      const layer: FifoStockLayer = {
        id: nextLayerId++,
        domain: "ingredient",
        itemId: event.ingredientId,
        sourceDocumentType: "ingredient-purchase",
        sourceDocumentId: event.sourceDocumentId,
        sourceLineId: event.sourceLineId,
        originalQuantity: event.quantity,
        remainingQuantity: event.quantity,
        unitCost: event.cost / event.quantity,
        totalCost: event.cost,
        occurredAt: event.occurredAt,
      };
      layers.push(layer);
      upsertOpenLayer(ingredientStates, event.ingredientId, layer);
      continue;
    }

    if (event.kind === "production-output") {
      validatePositiveFifoInboundQuantity(event.kind, event.quantity);
      const layer: FifoStockLayer = {
        id: nextLayerId++,
        domain: "product",
        itemId: event.productId,
        sourceDocumentType: "production-output",
        sourceDocumentId: event.sourceDocumentId,
        sourceLineId: event.sourceLineId,
        originalQuantity: event.quantity,
        remainingQuantity: event.quantity,
        unitCost: event.cost / event.quantity,
        totalCost: event.cost,
        occurredAt: event.occurredAt,
      };
      layers.push(layer);
      upsertOpenLayer(productStates, event.productId, layer);
      continue;
    }

    const ingredientState = getOrCreateFifoState(ingredientStates, event.ingredientId);
    let quantityToAllocate = event.quantity;
    const candidateLayers =
      event.kind === "purchase-correction" && typeof event.sourceLineId === "number"
        ? ingredientState.openLayers.filter((layer) => layer.sourceLineId === event.sourceLineId)
        : ingredientState.openLayers;

    for (const layer of candidateLayers) {
      if (quantityToAllocate <= STOCK_EPSILON) {
        break;
      }

      if (layer.remainingQuantity <= STOCK_EPSILON) {
        continue;
      }

      const allocatedQuantity = Math.min(layer.remainingQuantity, quantityToAllocate);
      layer.remainingQuantity = roundStockQuantity(layer.remainingQuantity - allocatedQuantity);
      quantityToAllocate = roundStockQuantity(quantityToAllocate - allocatedQuantity);

      allocations.push({
        id: nextAllocationId++,
        domain: "ingredient",
        itemId: event.ingredientId,
        outboundDocumentType: event.kind,
        outboundDocumentId: event.outboundDocumentId,
        outboundLineId: event.outboundLineId,
        stockLayerId: layer.id,
        allocatedQuantity,
        unitCost: layer.unitCost,
        allocatedCost: roundStockCost(allocatedQuantity * layer.unitCost),
        occurredAt: event.occurredAt,
      });
    }

    ingredientState.openLayers = ingredientState.openLayers.filter(
      (layer) => layer.remainingQuantity > STOCK_EPSILON,
    );

    if (quantityToAllocate > STOCK_EPSILON) {
      throw new StockLedgerConflictError(
        event.ingredientId,
        `Insufficient ingredient stock in chronological history for ingredient ${event.ingredientId}`,
      );
    }

    ingredientState.hasHistory = true;
  }

  return { ingredientStates, productStates, layers, allocations };
}

export function getFifoStockSnapshot(states: FifoStockStates, itemId: number) {
  const state = states.get(itemId);
  const openLayers = state?.openLayers ?? [];
  const quantity = roundStockQuantity(
    openLayers.reduce((sum, layer) => sum + layer.remainingQuantity, 0),
  );
  const totalCost = roundStockCost(
    openLayers.reduce((sum, layer) => sum + layer.remainingQuantity * layer.unitCost, 0),
  );

  return {
    quantity,
    totalCost,
    averageUnitCost: quantity > 0 ? Number((totalCost / quantity).toFixed(6)) : 0,
    hasHistory: state?.hasHistory ?? false,
    layerCount: openLayers.length,
  };
}

export function buildFifoStatesFromLayers(
  layers: Array<{
    id: number;
    domain: FifoStockDomain;
    itemId: number;
    sourceDocumentType: string;
    sourceDocumentId: number;
    sourceLineId?: number | null;
    originalQuantity: number;
    remainingQuantity: number;
    unitCost: number;
    totalCost: number;
    occurredAt: Date | string;
  }>,
) {
  const states: FifoStockStates = new Map();

  for (const layer of layers) {
    const state = getOrCreateFifoState(states, layer.itemId);
    state.hasHistory = true;

    if (layer.remainingQuantity <= STOCK_EPSILON) {
      continue;
    }

    state.openLayers.push({
      id: layer.id,
      domain: layer.domain,
      itemId: layer.itemId,
      sourceDocumentType: layer.sourceDocumentType,
      sourceDocumentId: layer.sourceDocumentId,
      sourceLineId: layer.sourceLineId ?? undefined,
      originalQuantity: layer.originalQuantity,
      remainingQuantity: layer.remainingQuantity,
      unitCost: layer.unitCost,
      totalCost: layer.totalCost,
      occurredAt: layer.occurredAt,
    });
  }

  return states;
}

function getOrCreateFifoState(states: FifoStockStates, itemId: number) {
  const existing = states.get(itemId);
  if (existing) {
    return existing;
  }

  const created: FifoStockState = {
    hasHistory: false,
    openLayers: [],
  };
  states.set(itemId, created);
  return created;
}

function upsertOpenLayer(states: FifoStockStates, itemId: number, layer: FifoStockLayer) {
  const state = getOrCreateFifoState(states, itemId);
  state.hasHistory = true;
  state.openLayers.push(layer);
}
