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
  supplierName: string;
};

export function DeleteSupplierDialog({
  supplierName,
}: DeleteSupplierDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete supplier</DialogTitle>
          <DialogDescription>
            This will remove {supplierName} once delete wiring is implemented.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
