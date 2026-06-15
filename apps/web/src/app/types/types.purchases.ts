export type PurchasesTab = "expenses" | "ingredient-purchases" | "purchase-corrections";

export type PurchasesPageProps = {
  searchParams?: Promise<{
    q?: string;
    tab?: string;
  }>;
};
