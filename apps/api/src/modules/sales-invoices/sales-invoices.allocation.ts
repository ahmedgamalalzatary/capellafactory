export function resolveSalesInvoiceLineRevenue(input: {
  quantity: number;
  sellingUnitPrice: number;
}) {
  return {
    sellingUnitPrice: input.sellingUnitPrice,
    lineTotal: Number((input.quantity * input.sellingUnitPrice).toFixed(3)),
  };
}

export function calculateSalesInvoiceLineCostFromAllocations(
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

export function allocateSalesInvoiceLineFromLayers(
  request: {
    productId: number;
    invoiceId: number;
    invoiceLineId: number;
    quantity: number;
    occurredAt: Date;
  },
  layers: Array<{
    id: number;
    remainingQuantity: number;
    unitCost: number;
  }>,
) {
  const allocations: Array<{
    domain: "product";
    itemId: number;
    outboundDocumentType: "sales-invoice";
    outboundDocumentId: number;
    outboundLineId: number;
    stockLayerId: number;
    allocatedQuantity: string;
    unitCost: string;
    allocatedCost: string;
    occurredAt: Date;
  }> = [];

  let remaining = request.quantity;

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
      domain: "product",
      itemId: request.productId,
      outboundDocumentType: "sales-invoice",
      outboundDocumentId: request.invoiceId,
      outboundLineId: request.invoiceLineId,
      stockLayerId: layer.id,
      allocatedQuantity: allocatedQuantity.toFixed(3),
      unitCost: layer.unitCost.toFixed(6),
      allocatedCost: allocatedCost.toFixed(3),
      occurredAt: request.occurredAt,
    });

    remaining = Number((remaining - allocatedQuantity).toFixed(3));
  }

  const costSummary = calculateSalesInvoiceLineCostFromAllocations(
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
