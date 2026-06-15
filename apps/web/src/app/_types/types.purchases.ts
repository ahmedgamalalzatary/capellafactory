export type PurchasesTab = "expenses" | "ingredient-purchases";

export type PurchasesPageProps = {
  searchParams?: Promise<{
    q?: string;
    tab?: string;
  }>;
};
