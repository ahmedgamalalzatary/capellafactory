import type { Supplier } from "@capella/shared/suppliers/supplier.types";

const suppliersStore: Supplier[] = [
  {
    id: 1,
    name: "Nile Paper Goods",
    phone: "+20 100 000 0001",
    where: "Cairo",
    notes: "Primary supplier for packaging materials.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function listSuppliers() {
  return suppliersStore;
}

export async function getSupplierById(id: number) {
  return suppliersStore.find((supplier) => supplier.id === id) ?? null;
}

export async function createSupplier(
  input: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
) {
  const supplier: Supplier = {
    id: suppliersStore.length + 1,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  suppliersStore.push(supplier);
  return supplier;
}

export async function updateSupplier(
  id: number,
  input: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
) {
  const supplier = suppliersStore.find((item) => item.id === id);

  if (!supplier) {
    return null;
  }

  Object.assign(supplier, input, {
    updatedAt: new Date().toISOString(),
  });

  return supplier;
}

export async function deleteSupplier(id: number) {
  const index = suppliersStore.findIndex((supplier) => supplier.id === id);

  if (index === -1) {
    return false;
  }

  suppliersStore.splice(index, 1);
  return true;
}
