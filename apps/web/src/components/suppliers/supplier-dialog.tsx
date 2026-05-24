"use client";

import { useState } from "react";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { SupplierForm } from "./supplier-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SupplierDialogProps = {
  supplier?: Supplier;
  triggerLabel?: string;
};

export function SupplierDialog({ supplier, triggerLabel }: SupplierDialogProps) {
  const isEdit = Boolean(supplier);
  const label = triggerLabel ?? (isEdit ? "تعديل" : "إضافة مورد");
  const [open, setOpen] = useState(false);

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          {label}
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          + {label}
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>
              {isEdit ? "تعديل مورد" : "إضافة مورد جديد"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث بيانات الاتصال والمعلومات التشغيلية للمورد."
                : "أضف موردًا جديدًا إلى السجل. الاسم والهاتف والملاحظات حقول مطلوبة."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SupplierForm
              supplierId={supplier?.id}
              initialValues={supplier}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel={isEdit ? "تحديث المورد" : "إنشاء مورد"}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
