import { z } from "zod";

export const ingredientUnitFamilySchema = z.enum(["weight", "volume", "count"]);
export const ingredientBaseUnitSchema = z.enum(["g", "ml", "piece"]);

export const ingredientInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unitFamily: ingredientUnitFamilySchema,
});
