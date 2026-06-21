import type {
  AdjustmentState,
  AdjustmentType,
  DocumentPaymentInput,
} from "../payments/document-payment.types.js";
import type { PaymentMethod, PaymentStatus } from "../payments/payment.types.js";

export type SalesInvoiceLineInput = {
  productId: number;
  quantity: number;
  sellingUnitPrice: number;
};

export type SalesInvoiceInput = {
  occurredAt: string;
  buyerId: number;
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
  payments: DocumentPaymentInput[];
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
  baseTotal: number;
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  taxAmount: number;
  totalAfterTax: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  buyerId: number;
  subtotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  totalCost: number;
  grossProfit: number;
  notes?: string;
  createdAt: string;
  lines: SalesInvoiceLine[];
};
