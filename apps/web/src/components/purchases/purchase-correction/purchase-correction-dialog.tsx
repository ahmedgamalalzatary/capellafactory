"use client";

import { useState } from "react";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PurchaseCorrectionForm } from "../purchase-correction/purchase-correction-form";

type PurchaseCorrectionDialogProps = {
  purchases: IngredientPurchase[];
  ingredients: Ingredient[];
};

export function PurchaseCorrectionDialog({
  purchases,
  ingredients,
}: PurchaseCorrectionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة عكس شراء</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>إضافة عكس شراء</SheetTitle>
            <SheetDescription>
              استخدم هذا النموذج لعكس جزء من فاتورة خامات موجودة بدون تعديل السجل الأصلي.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <PurchaseCorrectionForm
              purchases={purchases}
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
