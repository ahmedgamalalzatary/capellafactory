import { supplierInputSchema } from "@capella/shared/suppliers/supplier.schema";

export const createSupplierSchema = supplierInputSchema;
export const updateSupplierSchema = supplierInputSchema.partial();
