"use client";

import { useState } from "react";
import type { SolidAsset } from "@capella/shared/solid-assets/solid-asset.types";
import { SolidAssetForm } from "./solid-asset-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SolidAssetDialogProps = {
  asset?: SolidAsset;
  triggerLabel?: string;
};

export function SolidAssetDialog({ asset, triggerLabel }: SolidAssetDialogProps) {
  const isEdit = Boolean(asset);
  const label = triggerLabel ?? (isEdit ? "تعديل" : "إضافة أصل");
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
            <SheetTitle>{isEdit ? "تعديل أصل ثابت" : "إضافة أصل ثابت جديد"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث اسم الأصل أو كميته أو سعر الواحدة."
                : "أضف أصلًا ثابتًا جديدًا مع الكمية وسعر الواحدة."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SolidAssetForm
              assetId={asset?.id}
              initialValues={asset}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel={isEdit ? "تحديث الأصل" : "إنشاء الأصل"}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
