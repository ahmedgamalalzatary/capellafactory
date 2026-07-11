import { z } from "zod";

export const supplierInputSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  where: z.string().optional(),
  notes: z.string().min(1, "الملاحظات لا يمكن أن تكون فارغة").optional(),
});
