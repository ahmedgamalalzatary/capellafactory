import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteSupplierDialog } from "./delete-supplier-dialog";
import { SupplierDialog } from "./supplier-dialog";

type SuppliersTableProps = {
  suppliers: Supplier[];
};

export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Where</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell>{supplier.name}</TableCell>
            <TableCell>{supplier.phone}</TableCell>
            <TableCell>{supplier.where ?? "-"}</TableCell>
            <TableCell>{supplier.notes}</TableCell>
            <TableCell className="flex justify-end gap-2">
              <SupplierDialog supplier={supplier} triggerLabel="Edit" />
              <DeleteSupplierDialog supplierName={supplier.name} />
            </TableCell>
          </TableRow>
        ))}
        {suppliers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-[var(--muted)]">
              No suppliers found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
