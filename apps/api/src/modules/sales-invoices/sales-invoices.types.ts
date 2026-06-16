export type SalesInvoiceStockCheck = {
  productId: number;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
};

export type SalesInvoiceMinimumPriceCheck = {
  productId: number;
  productName: string;
  sellingUnitPrice: number;
  minimumUnitPrice: number;
};
