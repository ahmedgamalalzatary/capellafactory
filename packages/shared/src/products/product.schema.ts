import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
});
