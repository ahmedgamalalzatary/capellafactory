import type { Supplier } from "@capella/shared/suppliers/supplier.types";
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-grid h-8 w-8 place-items-center border border-[var(--ink)] bg-[var(--paper)] font-mono text-[10px]">
      {initials || "??"}
    </span>
  );
}

export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10 pl-4">
            <span className="font-mono text-[10px] text-[var(--muted-soft)]">#</span>
          </TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Where</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right pr-4">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier, idx) => (
          <TableRow key={supplier.id} className="group">
            <TableCell className="pl-4 font-mono text-[11px] text-[var(--muted)]">
              {String(idx + 1).padStart(3, "0")}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={supplier.name} />
                <div className="leading-tight">
                  <p className="text-[13px] font-medium">{supplier.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    SUP·{String(supplier.id).padStart(4, "0")}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="font-mono text-[12px]">{supplier.phone}</TableCell>
            <TableCell>
              {supplier.where ? (
                <span className="inline-flex items-center gap-1.5 border border-[var(--line-strong)] px-2 py-0.5 text-[11px]">
                  <span className="inline-block h-1 w-1 bg-[var(--ink)]" />
                  {supplier.where}
                </span>
              ) : (
                <span className="font-mono text-[11px] text-[var(--muted-soft)]">—</span>
              )}
            </TableCell>
            <TableCell className="text-[12px] text-[var(--muted)] max-w-[28ch]">
              <span className="line-clamp-2">{supplier.notes}</span>
            </TableCell>
            <TableCell className="pr-4">
              <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <SupplierDialog supplier={supplier} triggerLabel="Edit" />
                <DeleteSupplierDialog supplierId={supplier.id} supplierName={supplier.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
        {suppliers.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={6} className="py-20 text-center">
              <div className="mx-auto max-w-sm">
                <div className="mx-auto h-12 w-12 border border-[var(--line-strong)] grid place-items-center font-mono text-[11px] text-[var(--muted)]">
                  ∅
                </div>
                <p className="mt-4 font-display text-2xl">No suppliers yet</p>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  The registry is empty. Add the first supplier to begin recording
                  purchasing relationships.
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
