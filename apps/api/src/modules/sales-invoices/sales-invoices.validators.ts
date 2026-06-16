import type { SalesInvoiceStockCheck } from "./sales-invoices.types.js";

export class SalesInvoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function formatStockQuantity(value: number) {
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

export function validateSalesInvoiceNotBackdated(occurredAt: string | Date, now = new Date()) {
  const occurred = new Date(occurredAt);

  if (occurred.getTime() < now.getTime() - 60_000) {
    throw new SalesInvoiceValidationError("Sales invoices cannot be backdated");
  }
}
