import type { IngredientUnitFilter } from "@/lib/inventory";

export const inventoryTabs = [
  { key: "ingredients", label: "الخامات" },
  { key: "products", label: "المنتجات النهائية" },
] as const;

export const ingredientUnitFilters: { key: IngredientUnitFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "weight", label: "وزن" },
  { key: "volume", label: "حجم" },
  { key: "count", label: "عدد" },
];
