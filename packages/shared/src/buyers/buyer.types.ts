export type Buyer = {
  id: number;
  name: string;
  phone: string;
  where?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BuyerInput = {
  name: string;
  phone: string;
  where?: string;
  notes?: string;
};
