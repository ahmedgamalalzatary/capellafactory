import type { IngredientUnitFilter } from "@/lib/inventory";

export function buildInventoryHref({
  tab,
  q,
  archived,
  unitFamily,
}: {
  tab: "ingredients" | "products";
  q?: string;
  archived: boolean;
  unitFamily?: IngredientUnitFilter;
}) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (q) {
    params.set("q", q);
  }

  if (archived) {
    params.set("archived", "true");
  }

  if (tab === "ingredients" && unitFamily && unitFamily !== "all") {
    params.set("unitFamily", unitFamily);
  }

  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}
