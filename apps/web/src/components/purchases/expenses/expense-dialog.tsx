"use client";

import { useState } from "react";
import { ExpenseForm } from "./expense-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ExpenseDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة مصروف</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>تسجيل مصروف جديد</SheetTitle>
            <SheetDescription>
              أدخل المصروف كما دُفع في الواقع. السجل يُحفظ مرة واحدة فقط ولا يدعم التعديل
              أو الحذف في هذه المرحلة.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ExpenseForm
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel="تسجيل المصروف"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
