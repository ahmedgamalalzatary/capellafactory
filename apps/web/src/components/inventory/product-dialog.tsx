"use client";

import { useState } from "react";
import type { Product } from "@capella/shared/products/product.types";
import { ProductForm } from "./product-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ProductDialogProps = {
  product?: Product;
  triggerLabel?: string;
};

export function ProductDialog({ product, triggerLabel }: ProductDialogProps) {
  const isEdit = Boolean(product);
  const label = triggerLabel ?? (isEdit ? "تعديل" : "إضافة منتج");
  const [open, setOpen] = useState(false);

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          {label}
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>+ {label}</Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{isEdit ? "تعديل منتج" : "إضافة منتج جديد"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث اسم المنتج قبل أن يبدأ في اكتساب تاريخ إنتاج أو مبيعات."
                : "أنشئ سجل المنتج النهائي الذي سيظهر لاحقًا في الإنتاج والمبيعات."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductForm
              productId={product?.id}
              initialValues={product}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel={isEdit ? "تحديث المنتج" : "إنشاء المنتج"}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
