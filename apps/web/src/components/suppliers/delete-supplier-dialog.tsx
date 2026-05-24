"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSupplier } from "@/api-client/suppliers";
import { useToast } from "@/components/ui/toaster";
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
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onDelete() {
    setIsSubmitting(true);
    try {
      await deleteSupplier(supplierId);
      setOpen(false);
      router.refresh();
      toast("تم حذف المورد بنجاح");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "فشل الحذف. حاول مجددًا.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          حذف
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogDescription>
            سيتم حذف بيانات المورد نهائيًا من السجل. لا يمكن التراجع عن هذه العملية.
          </DialogDescription>
        </DialogHeader>

        <div
          className="px-3 py-3 mb-5"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <p className="text-[11px] text-muted-foreground mb-0.5">السجل المستهدف</p>
          <p className="text-[14px] font-semibold text-foreground">{supplierName}</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحذف…" : "تأكيد الحذف"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
