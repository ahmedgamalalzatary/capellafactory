import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const salesInvoiceLineInputSchema = z.object({
  productId: z.coerce.number().int().positive("Product is required"),
  quantity: z.coerce.number().int("Quantity must be a whole number").positive("Quantity must be greater than zero"),
  sellingUnitPrice: z.coerce.number().positive("Selling unit price must be greater than zero"),
});

export const salesInvoiceInputSchema = z
  .object({
    occurredAt: z
      .string()
      .datetime({ offset: true, message: "Occurred at must be a valid datetime" }),
    buyerId: z.coerce.number().int().positive("Buyer is required"),
    notes: optionalTrimmedString,
    lines: z.array(salesInvoiceLineInputSchema).min(1, "At least one product line is required"),
  })
  .strict()
  .transform((value) => ({
    ...value,
    notes: value.notes?.trim(),
  }))
  .superRefine((value, ctx) => {
    const seenProductIds = new Set<number>();

    value.lines.forEach((line, index) => {
      if (seenProductIds.has(line.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "productId"],
          message: "Product cannot appear more than once in the same invoice",
        });
        return;
      }

      seenProductIds.add(line.productId);
    });
  });
