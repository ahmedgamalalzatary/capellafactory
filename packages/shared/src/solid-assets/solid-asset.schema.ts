import { z } from "zod";

const trimmedRequiredString = z.string().trim().min(1, "Name is required");

const solidAssetInputSchema = z.object({
  name: trimmedRequiredString,
  qty: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  priceOfOne: z.coerce.number().positive("Price must be greater than zero"),
});

export const createSolidAssetSchema = solidAssetInputSchema;
export const updateSolidAssetSchema = solidAssetInputSchema.partial().refine(
  (value) =>
    value.name !== undefined || value.qty !== undefined || value.priceOfOne !== undefined,
  {
    message: "At least one field is required",
  },
);
