"use client";

import { useState } from "react";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { IngredientPurchaseForm } from "../ingredients/ingredient-purchase-form";

type IngredientPurchaseDialogProps = {
  suppliers: Supplier[];
  ingredients: Ingredient[];
};

export function IngredientPurchaseDialog({
  suppliers,
  ingredients,
}: IngredientPurchaseDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة فاتورة خامات</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>إضافة فاتورة شراء خامات</SheetTitle>
            <SheetDescription>
              احفظ الفاتورة كما حدثت فعليًا. الحفظ يرفع رصيد الخامات تلقائيًا.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <IngredientPurchaseForm
              suppliers={suppliers}
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
