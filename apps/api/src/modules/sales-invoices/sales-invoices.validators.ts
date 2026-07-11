import type {
  SalesInvoiceMinimumPriceCheck,
  SalesInvoiceStockCheck,
} from "./sales-invoices.types.js";

export class SalesInvoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function formatStockQuantity(value: number) {
  return parseFloat(value.toFixed(3)).toString();
}

function formatMoney(value: number) {
  return parseFloat(value.toFixed(3)).toString();
}

export function validateSalesInvoiceStock(checks: SalesInvoiceStockCheck[]) {
  const shortages = checks.filter((check) => check.requestedQuantity > check.availableQuantity);

  if (shortages.length === 0) {
    return;
  }

  const details = shortages
    .map(
      (check) =>
        `${check.productName} (متاح ${formatStockQuantity(check.availableQuantity)}، مطلوب ${formatStockQuantity(check.requestedQuantity)})`,
    )
    .join("؛ ");

  throw new SalesInvoiceValidationError(`المخزون غير كافٍ من: ${details}`);
}

export function validateSalesInvoiceMinimumPrices(checks: SalesInvoiceMinimumPriceCheck[]) {
  const belowMinimum = checks.filter((check) => check.sellingUnitPrice < check.minimumUnitPrice);

  if (belowMinimum.length === 0) {
    return;
  }

  const details = belowMinimum
    .map(
      (check) =>
        `${check.productName} أقل من سعر الوحدة: السعر ${formatMoney(check.sellingUnitPrice)}، الحد الأدنى ${formatMoney(check.minimumUnitPrice)}`,
    )
    .join("؛ ");

  throw new SalesInvoiceValidationError(`سعر بيع المنتج ${details}`);
}

export function validateSalesInvoiceNotBackdated(occurredAt: string | Date, now = new Date()) {
  const occurred = new Date(occurredAt);

  // Allow a small client/server clock-skew and submission-delay window for "now" invoices.
  if (occurred.getTime() < now.getTime() - 60_000) {
    throw new SalesInvoiceValidationError("لا يمكن إدخال فاتورة بيع بتاريخ سابق");
  }
}
