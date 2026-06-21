import type {
  AdjustmentState,
  AdjustmentType,
  DocumentPaymentInput,
} from "../payments/document-payment.types.js";
import type { PaymentMethod, PaymentStatus } from "../payments/payment.types.js";

export const ingredientPurchaseUnits = ["kg", "g", "L", "ml", "piece"] as const;

export type IngredientPurchaseUnit = (typeof ingredientPurchaseUnits)[number];

export type IngredientPurchaseLineInput = {
  ingredientId: number;
  quantity: number;
  unit: IngredientPurchaseUnit;
  lineTotal: number;
};

export type IngredientPurchaseInput = {
  occurredAt: string;
  supplierId: number;
  taxState: AdjustmentState;
  taxType?: AdjustmentType;
  taxValue: number;
  discountState: AdjustmentState;
  discountType?: AdjustmentType;
  discountValue: number;
  payments: DocumentPaymentInput[];
  notes?: string;
  lines: IngredientPurchaseLineInput[];
};

export type IngredientPurchaseLine = {
  id: number;
  ingredientId: number;
  quantity: number;
  unit: IngredientPurchaseUnit;
  unitPrice: number;
  lineTotal: number;
  normalizedQuantity: number;
};

export type IngredientPurchasePayment = {
  id: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
};

export type IngredientPurchase = {
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
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  supplierId?: number;
  supplierName?: string;
  notes?: string;
  createdAt: string;
  payments: IngredientPurchasePayment[];
  lines: IngredientPurchaseLine[];
};
