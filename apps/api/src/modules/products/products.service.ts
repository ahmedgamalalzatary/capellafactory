import type { ProductInput } from "@capella/shared/products/product.types";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  reactivateProduct,
  updateProduct,
} from "./products.repository.js";

export async function getProducts(query?: string, includeArchived = false) {
  return listProducts(query, includeArchived);
}

export async function getProduct(id: number) {
  return getProductById(id);
}

export async function addProduct(input: ProductInput) {
  return createProduct(input);
}

export async function editProduct(id: number, input: Partial<ProductInput>) {
  return updateProduct(id, input);
}

export async function archiveProductRecord(id: number) {
  return archiveProduct(id);
}

export async function reactivateProductRecord(id: number) {
  return reactivateProduct(id);
}

export async function removeProduct(id: number) {
  return deleteProduct(id);
}
