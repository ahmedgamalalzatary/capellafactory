export function buildIngredientPurchaseInvoiceCode(occurredAt: Date, sequence: number) {
  const year = occurredAt.getUTCFullYear();
  const month = String(occurredAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(occurredAt.getUTCDate()).padStart(2, "0");
  const counter = String(sequence).padStart(4, "0");

  return `PUR-${year}${month}${day}-${counter}`;
}
