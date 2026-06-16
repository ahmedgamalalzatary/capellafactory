import type {
  SalesInvoice,
  SalesInvoiceLine,
} from "@capella/shared/sales-invoices/sales-invoice.types";

export type SalesInvoiceRow = {
  id: number;
  invoiceCode: string;
  occurredAt: Date | string;
  buyerId: number;
  subtotal: string | number;
  totalCost: string | number;
  grossProfit: string | number;
  notes?: string | null;
  createdAt: Date | string;
};

export type SalesInvoiceLineRow = {
  id: number;
  productId: number;
  quantity: string | number;
  sellingUnitPrice: string | number;
  lineTotal: string | number;
  unitCost: string | number;
  lineCost: string | number;
};

export function mapSalesInvoiceLineRow(row: SalesInvoiceLineRow): SalesInvoiceLine {
  return {
    id: row.id,
    productId: row.productId,
    quantity: Number(row.quantity),
    sellingUnitPrice: Number(row.sellingUnitPrice),
    lineTotal: Number(row.lineTotal),
    unitCost: Number(row.unitCost),
    lineCost: Number(row.lineCost),
  };
}

export function mapSalesInvoiceRowToSalesInvoice(
  row: SalesInvoiceRow,
  lines: SalesInvoiceLineRow[],
): SalesInvoice {
  return {
    id: row.id,
    invoiceCode: row.invoiceCode,
    occurredAt: toIsoString(row.occurredAt),
    buyerId: row.buyerId,
    subtotal: Number(row.subtotal),
    totalCost: Number(row.totalCost),
    grossProfit: Number(row.grossProfit),
    notes: row.notes ?? undefined,
    createdAt: toIsoString(row.createdAt),
    lines: lines.map(mapSalesInvoiceLineRow),
  };
}

export function normalizeSalesInvoiceSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
