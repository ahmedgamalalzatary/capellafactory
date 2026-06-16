"use client";

import { useState } from "react";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import { IngredientForm } from "./ingredient-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type IngredientDialogProps = {
  ingredient?: Ingredient;
  triggerLabel?: string;
};

export function IngredientDialog({ ingredient, triggerLabel }: IngredientDialogProps) {
  const isEdit = Boolean(ingredient);
  const label = triggerLabel ?? (isEdit ? "تعديل" : "إضافة خام");
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
            <SheetTitle>{isEdit ? "تعديل خام" : "إضافة خام جديد"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث اسم المادة أو عائلة الوحدة قبل بدء استخدامها في الحركات."
                : "أنشئ سجل خام موحدًا يمكن الاعتماد عليه في المدفوعات والإنتاج لاحقًا."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <IngredientForm
              ingredientId={ingredient?.id}
              initialValues={ingredient}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel={isEdit ? "تحديث الخام" : "إنشاء الخام"}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
