import { z } from "zod";

export const supplierInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  where: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
});
