import type { SupplierInput } from "@capella/shared/suppliers/supplier.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SupplierFormProps = {
  initialValues?: Partial<SupplierInput>;
  submitLabel?: string;
};

export function SupplierForm({
  initialValues,
  submitLabel = "Save Supplier",
}: SupplierFormProps) {
  return (
    <form className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={initialValues?.phone} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="where">Where</Label>
        <Input id="where" name="where" defaultValue={initialValues?.where} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initialValues?.notes} required />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
