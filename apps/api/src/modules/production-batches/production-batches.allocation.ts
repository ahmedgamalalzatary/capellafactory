export function calculateProductionBatchLineCostFromAllocations(
  allocations: Array<{ allocatedQuantity: number; allocatedCost: number }>,
) {
  const quantity = Number(
    allocations.reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0).toFixed(3),
  );
  const lineCost = Number(
    allocations.reduce((sum, allocation) => sum + allocation.allocatedCost, 0).toFixed(3),
  );

  return {
    quantity,
    lineCost,
    unitCost: quantity > 0 ? Number((lineCost / quantity).toFixed(6)) : 0,
  };
}

export function buildProductionBatchIngredientAllocationRequest(input: {
  ingredientId: number;
  batchId: number;
  batchLineId: number;
  normalizedQuantity: number;
  occurredAt: Date;
}) {
  return {
    domain: "ingredient" as const,
    itemId: input.ingredientId,
    outboundDocumentType: "production-consumption",
    outboundDocumentId: input.batchId,
    outboundLineId: input.batchLineId,
    quantity: input.normalizedQuantity,
    occurredAt: input.occurredAt,
  };
}

export function buildProductionBatchOutputLayer(input: {
  batchId: number;
  productId: number;
  producedQuantity: number;
  totalCost: number;
  occurredAt: Date;
}) {
  if (input.producedQuantity <= 0) {
    throw new Error("كمية الإنتاج يجب أن تكون أكبر من صفر");
  }
  return {
    domain: "product" as const,
    itemId: input.productId,
    sourceDocumentType: "production-output",
    sourceDocumentId: input.batchId,
    sourceLineId: null,
    originalQuantity: input.producedQuantity.toFixed(3),
    remainingQuantity: input.producedQuantity.toFixed(3),
    unitCost: (input.totalCost / input.producedQuantity).toFixed(6),
    totalCost: input.totalCost.toFixed(3),
    occurredAt: input.occurredAt,
  };
}

export function allocateProductionBatchLineFromLayers(
  request: {
    ingredientId: number;
    batchId: number;
    batchLineId: number;
    normalizedQuantity: number;
    occurredAt: Date;
  },
  layers: Array<{
    id: number;
    sourceLineId?: number | null;
    remainingQuantity: number;
    unitCost: number;
  }>,
) {
  const allocations: Array<{
    domain: "ingredient";
    itemId: number;
    outboundDocumentType: "production-consumption";
    outboundDocumentId: number;
    outboundLineId: number;
    stockLayerId: number;
    allocatedQuantity: string;
    unitCost: string;
    allocatedCost: string;
    occurredAt: Date;
  }> = [];

  let remaining = request.normalizedQuantity;

  for (const layer of layers) {
    if (remaining <= 0) {
      break;
    }

    const allocatedQuantity = Math.min(layer.remainingQuantity, remaining);
    if (allocatedQuantity <= 0) {
      continue;
    }

    const allocatedCost = allocatedQuantity * layer.unitCost;
    allocations.push({
      domain: "ingredient",
      itemId: request.ingredientId,
      outboundDocumentType: "production-consumption",
      outboundDocumentId: request.batchId,
      outboundLineId: request.batchLineId,
      stockLayerId: layer.id,
      allocatedQuantity: allocatedQuantity.toFixed(3),
      unitCost: layer.unitCost.toFixed(6),
      allocatedCost: allocatedCost.toFixed(3),
      occurredAt: request.occurredAt,
    });

    remaining = Number((remaining - allocatedQuantity).toFixed(3));
  }

  const costSummary = calculateProductionBatchLineCostFromAllocations(
    allocations.map((allocation) => ({
      allocatedQuantity: Number(allocation.allocatedQuantity),
      allocatedCost: Number(allocation.allocatedCost),
    })),
  );

  return {
    allocations,
    lineCost: costSummary.lineCost,
    unitCost: costSummary.unitCost,
  };
}
