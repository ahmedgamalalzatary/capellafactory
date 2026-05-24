import type { Product, ProductInput } from "@capella/shared/products/product.types";

export type ProductRecord = Product;
export type CreateProductInput = ProductInput;
export type UpdateProductInput = Partial<
  ProductInput & {
    isArchived: boolean;
  }
>;
