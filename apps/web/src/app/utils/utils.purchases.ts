import type { PurchasesTab } from "@/app/types/types.purchases";

export function formatPurchasesAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function buildPurchasesHref(tab: PurchasesTab, q?: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (q) {
    params.set("q", q);
  }

  const query = params.toString();
  return query ? `/purchases?${query}` : "/purchases";
}
