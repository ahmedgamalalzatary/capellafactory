export type Supplier = {
  id: number;
  name: string;
  phone: string;
  where?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierInput = {
  name: string;
  phone: string;
  where?: string;
  notes?: string;
};
