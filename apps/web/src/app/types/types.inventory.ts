export type InventoryPageProps = {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    archived?: string;
    unitFamily?: string;
  }>;
};
