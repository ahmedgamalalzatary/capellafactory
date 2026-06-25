export type SolidAsset = {
  id: number;
  name: string;
  qty: number;
  priceOfOne: number;
  createdAt: string;
  updatedAt: string;
};

export type SolidAssetWithTotalPrice = SolidAsset & {
  totalPrice: number;
};

export type SolidAssetInput = {
  name: string;
  qty: number;
  priceOfOne: number;
};
