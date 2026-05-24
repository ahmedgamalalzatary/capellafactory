"use client";

import { useState } from "react";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import { BuyerForm } from "./buyer-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type BuyerDialogProps = {
  buyer?: Buyer;
  triggerLabel?: string;
};

export function BuyerDialog({ buyer, triggerLabel }: BuyerDialogProps) {
  const isEdit = Boolean(buyer);
  const label = triggerLabel ?? (isEdit ? "تعديل" : "إضافة مشتري");
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
            <SheetTitle>{isEdit ? "تعديل مشتري" : "إضافة مشتري جديد"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث بيانات الاتصال والمعلومات التشغيلية للمشتري."
                : "أضف مشتريًا جديدًا إلى السجل. الاسم والهاتف حقول مطلوبة."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <BuyerForm
              buyerId={buyer?.id}
              initialValues={buyer}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel={isEdit ? "تحديث المشتري" : "إنشاء مشتري"}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
