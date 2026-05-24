import type { SupplierInput } from "@capella/shared/suppliers/supplier.types";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
} from "./suppliers.repository.js";

export async function getSuppliers(query?: string) {
  return listSuppliers(query);
}

export async function getSupplier(id: number) {
  return getSupplierById(id);
}

export async function addSupplier(input: SupplierInput) {
  return createSupplier(input);
}

export async function editSupplier(id: number, input: Partial<SupplierInput>) {
  return updateSupplier(id, input);
}

export async function removeSupplier(id: number) {
  return deleteSupplier(id);
}
