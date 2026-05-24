import type { Supplier } from "@capella/shared/suppliers/supplier.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const response = await fetch(`${API_URL}/suppliers`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return fallbackSuppliers;
    }

    return (await response.json()) as Supplier[];
  } catch {
    return fallbackSuppliers;
  }
}

const fallbackSuppliers: Supplier[] = [
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
