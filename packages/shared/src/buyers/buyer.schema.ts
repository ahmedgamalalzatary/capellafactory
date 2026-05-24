import { z } from "zod";

export const buyerInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  where: z.string().optional(),
  notes: z.string().min(1, "Notes cannot be empty").optional(),
});
