import type { SalesInvoiceInput } from "@capella/shared/sales-invoices/sales-invoice.types";
import {
  createSalesInvoice,
  getSalesInvoiceById,
  listSalesInvoices,
} from "./sales-invoices.repository.js";

export async function getSalesInvoices(query?: string) {
  return listSalesInvoices(query);
}

export async function getSalesInvoice(id: number) {
  return getSalesInvoiceById(id);
}

export async function addSalesInvoice(input: SalesInvoiceInput) {
  return createSalesInvoice(input);
}
