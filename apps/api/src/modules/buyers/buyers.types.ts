import type { Buyer, BuyerInput } from "@capella/shared/buyers/buyer.types";

export type BuyerRecord = Buyer;
export type CreateBuyerInput = BuyerInput;
export type UpdateBuyerInput = Partial<BuyerInput>;
