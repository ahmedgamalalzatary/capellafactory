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
  triggerLabel = "Add Supplier",
}: SupplierDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={supplier ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "Create supplier"}</DialogTitle>
          <DialogDescription>
            Required fields are name, phone, and notes.
          </DialogDescription>
        </DialogHeader>
        <SupplierForm
          initialValues={supplier}
          submitLabel={supplier ? "Update Supplier" : "Create Supplier"}
        />
      </DialogContent>
    </Dialog>
  );
}
