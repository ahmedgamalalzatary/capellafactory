import { z } from "zod";
export declare const supplierInputSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    where: z.ZodOptional<z.ZodString>;
    notes: z.ZodString;
}, z.core.$strip>;
