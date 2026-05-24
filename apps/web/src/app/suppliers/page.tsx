import { getSuppliers } from "@/api-client/suppliers";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            Capella ERP
          </p>
          <h1 className="text-4xl font-semibold">Suppliers</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Manage supplier records with required name, phone, and notes fields.
          </p>
        </div>
        <SupplierDialog />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
        </CardHeader>
        <CardContent>
          <SuppliersTable suppliers={suppliers} />
        </CardContent>
      </Card>
    </main>
  );
}
