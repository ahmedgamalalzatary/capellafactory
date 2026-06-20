import { salesInvoiceInputSchema } from "@capella/shared/sales-invoices/sales-invoice.schema";
import { paymentInputSchema } from "@capella/shared/payments/payment.schema";

export const createSalesInvoiceSchema = salesInvoiceInputSchema;
export const addSalesInvoicePaymentSchema = paymentInputSchema;
