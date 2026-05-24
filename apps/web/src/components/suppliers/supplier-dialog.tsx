"use client";

import { useState } from "react";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { SupplierForm } from "./supplier-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SupplierDialogProps = {
  supplier?: Supplier;
  triggerLabel?: string;
};

export function SupplierDialog({
  supplier,
  triggerLabel,
}: SupplierDialogProps) {
  const isEdit = Boolean(supplier);
  const label = triggerLabel ?? (isEdit ? "Edit" : "New supplier");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          variant={isEdit ? "outline" : "default"}
          size={isEdit ? "sm" : "md"}
          onClick={() => setOpen((current) => !current)}
        >
          {isEdit ? null : (
            <span className="font-mono text-[14px] leading-none">+</span>
          )}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {isEdit ? "Modify · F.001" : "Create · F.000"}
          </p>
          <DialogTitle>
            {isEdit ? (
              <>
                Edit <span className="italic">supplier</span>
              </>
            ) : (
              <>
                Add a <span className="italic">supplier</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contact and operational details. Changes are written immediately to the registry."
              : "Register a new partner in the supplier ledger. Name, phone, and notes are required."}
          </DialogDescription>
        </DialogHeader>
        <SupplierForm
          supplierId={supplier?.id}
          initialValues={supplier}
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
          submitLabel={isEdit ? "Update supplier" : "Create supplier"}
        />
      </DialogContent>
    </Dialog>
  );
}
