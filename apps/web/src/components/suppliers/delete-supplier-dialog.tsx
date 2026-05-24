"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSupplier } from "@/api-client/suppliers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteSupplierDialogProps = {
  supplierId: number;
  supplierName: string;
};

export function DeleteSupplierDialog({
  supplierId,
  supplierName,
}: DeleteSupplierDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteSupplier(supplierId);
      setOpen(false);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen((current) => !current)}
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Destructive · D.001
          </p>
          <DialogTitle>
            Remove <span className="italic">{supplierName}</span>?
          </DialogTitle>
          <DialogDescription>
            This will permanently delete the supplier record from the registry.
            Linked purchase orders and historical receipts will retain a
            tombstoned reference to the original entity.
          </DialogDescription>
        </DialogHeader>

        <div className="border border-[var(--line)] bg-[var(--bone)] px-4 py-3 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Target record
          </p>
          <p className="mt-1 text-[14px] font-medium">{supplierName}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Confirmation required
            </p>
            {error ? <p className="mt-1 text-[12px] text-red-700">{error}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={onDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete supplier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
