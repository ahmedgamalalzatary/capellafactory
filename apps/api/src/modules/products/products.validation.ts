import { z } from "zod";
import { productInputSchema } from "@capella/shared/products/product.schema";

export const createProductSchema = productInputSchema;
export const updateProductSchema = productInputSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
