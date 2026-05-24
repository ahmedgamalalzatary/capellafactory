import { buyerInputSchema } from "@capella/shared/buyers/buyer.schema";

export const createBuyerSchema = buyerInputSchema;
export const updateBuyerSchema = buyerInputSchema.partial();
