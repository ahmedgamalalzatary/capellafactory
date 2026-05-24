import type {
  Supplier,
  SupplierInput,
} from "@capella/shared/suppliers/supplier.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await fetch(`${API_URL}/suppliers`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch suppliers");
  }

  return (await response.json()) as Supplier[];
}

export async function createSupplier(input: SupplierInput) {
  return mutateSupplier(`${CLIENT_API_URL}/suppliers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSupplier(id: number, input: Partial<SupplierInput>) {
  return mutateSupplier(`${CLIENT_API_URL}/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteSupplier(id: number) {
  const response = await fetch(`${CLIENT_API_URL}/suppliers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Failed to delete supplier");
  }
}

async function mutateSupplier(url: string, init: RequestInit) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Supplier request failed");
  }

  return (await response.json()) as Supplier;
}
