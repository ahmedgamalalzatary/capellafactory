import type {
  SalesInvoice,
  SalesInvoiceLine,
} from "@capella/shared/sales-invoices/sales-invoice.types";
import { createPaymentSummary } from "@capella/shared/payments/payment.schema";

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

export type ListedSalesInvoiceLineRow = SalesInvoiceLineRow & {
  invoiceId: number;
};

export type SalesInvoicePaymentTotalRow = {
  invoiceId: number;
  paidAmount: string | null;
};

export function createSalesInvoicePaymentTotalLookup(rows: SalesInvoicePaymentTotalRow[]) {
  return new Map(rows.map((row) => [row.invoiceId, row.paidAmount ? Number(row.paidAmount) : 0]));
}

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
  paidAmount = Number(row.subtotal),
): SalesInvoice {
  const subtotal = Number(row.subtotal);
  const summary = createPaymentSummary({ totalAmount: subtotal, paidAmount });

  return {
    id: row.id,
    invoiceCode: row.invoiceCode,
    occurredAt: toIsoString(row.occurredAt),
    buyerId: row.buyerId,
    subtotal,
    paidAmount: summary.paidAmount,
    remainingAmount: summary.remainingAmount,
    paymentStatus: summary.paymentStatus,
    totalCost: Number(row.totalCost),
    grossProfit: Number(row.grossProfit),
    notes: row.notes ?? undefined,
    createdAt: toIsoString(row.createdAt),
    lines: lines.map(mapSalesInvoiceLineRow),
  };
}

export function mapSalesInvoiceRowsToSalesInvoices(
  rows: SalesInvoiceRow[],
  lines: ListedSalesInvoiceLineRow[],
  paymentTotals = new Map<number, number>(),
): SalesInvoice[] {
  const linesByInvoiceId = new Map<number, SalesInvoiceLineRow[]>();

  for (const line of lines) {
    const existingLines = linesByInvoiceId.get(line.invoiceId) ?? [];
    existingLines.push(line);
    linesByInvoiceId.set(line.invoiceId, existingLines);
  }

  return rows.map((row) =>
    mapSalesInvoiceRowToSalesInvoice(
      row,
      linesByInvoiceId.get(row.id) ?? [],
      paymentTotals.get(row.id) ?? Number(row.subtotal),
    ),
  );
}

export function normalizeSalesInvoiceSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
