"use client";

import { useState } from "react";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Product } from "@capella/shared/products/product.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductionBatchForm } from "./production-batch-form";

type ProductionBatchDialogProps = {
  products: Product[];
  ingredients: Ingredient[];
};

export function ProductionBatchDialog({ products, ingredients }: ProductionBatchDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة تشغيلة إنتاج</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>إضافة تشغيلة إنتاج</SheetTitle>
            <SheetDescription>
              الحفظ يستهلك الخامات ويضيف رصيد المنتج النهائي بتكلفة محسوبة تلقائيًا.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductionBatchForm
              products={products}
              ingredients={ingredients}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
