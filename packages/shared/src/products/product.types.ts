export type Product = {
  id: number;
  name: string;
  stockQuantity: number;
  averageUnitCost: number;
  hasHistory: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
};
