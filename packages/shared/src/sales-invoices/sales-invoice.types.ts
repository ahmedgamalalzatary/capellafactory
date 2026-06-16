export type SalesInvoiceLineInput = {
  productId: number;
  quantity: number;
  sellingUnitPrice: number;
};

export type SalesInvoiceInput = {
  occurredAt: string;
  buyerId: number;
  notes?: string;
  lines: SalesInvoiceLineInput[];
};

export type SalesInvoiceLine = SalesInvoiceLineInput & {
  id: number;
  lineTotal: number;
  unitCost: number;
  lineCost: number;
};

export type SalesInvoice = {
  id: number;
  invoiceCode: string;
  occurredAt: string;
  buyerId: number;
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  notes?: string;
  createdAt: string;
  lines: SalesInvoiceLine[];
};
