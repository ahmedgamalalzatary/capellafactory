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

export type FifoStockState = {
  hasHistory: boolean;
  openLayers: FifoStockLayer[];
};

export type FifoStockStates = Map<number, FifoStockState>;

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
      kind: "purchase-correction";
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

function validatePositiveFifoInboundQuantity(kind: "ingredient-purchase" | "production-output", quantity: number) {
  if (quantity <= 0) {
    throw new Error(`FIFO inbound quantity must be greater than zero for ${kind}`);
  }
}

export function replayStockEvents(events: StockReplayEvent[]): {
  ingredientBalances: StockLedgerBalances;
  productBalances: StockLedgerBalances;
} {
  const ingredientBalances: StockLedgerBalances = new Map();
  const productBalances: StockLedgerBalances = new Map();

  const ordered = [...events].sort(compareChronologicalStockEvents);

  for (const event of ordered) {
    if (event.kind === "ingredient-purchase") {
      applyStockLedgerEntry(ingredientBalances, {
        itemId: event.ingredientId,
        quantityDelta: event.quantity,
        costDelta: event.cost,
      });
    } else if (
      event.kind === "production-consumption" ||
      event.kind === "purchase-correction"
    ) {
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
  return compareChronologicalStockEvents(left, right);
}

function compareChronologicalStockEvents(
  left: { id: number; occurredAt: Date | string; kind: string },
  right: { id: number; occurredAt: Date | string; kind: string },
) {
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

function stockEventKindWeight(kind: string) {
  switch (kind) {
    case "ingredient-purchase":
      return 0;
    case "purchase-correction":
      return 1;
    case "production-consumption":
      return 2;
    case "production-output":
      return 3;
    default:
      return 99;
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

function roundStockQuantity(value: number) {
  return Number(value.toFixed(3));
}

function roundStockCost(value: number) {
  return Number(value.toFixed(3));
}
