import { z } from "zod";

const trimmedRequiredString = z.string().trim().min(1, "الاسم مطلوب");

const solidAssetInputSchema = z.object({
  name: trimmedRequiredString,
  qty: z.coerce.number().int("الكمية يجب أن تكون عددًا صحيحًا").min(1, "الكمية يجب أن تكون 1 على الأقل"),
  priceOfOne: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
});

export const createSolidAssetSchema = solidAssetInputSchema;
export const updateSolidAssetSchema = solidAssetInputSchema.partial().refine(
  (value) =>
    value.name !== undefined || value.qty !== undefined || value.priceOfOne !== undefined,
  {
    message: "يجب إدخال حقل واحد على الأقل",
  },
);
