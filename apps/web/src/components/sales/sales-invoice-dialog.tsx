"use client";

import { useState } from "react";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SalesInvoiceForm } from "./sales-invoice-form";

type SalesInvoiceDialogProps = {
  buyers: Buyer[];
  products: Product[];
};

export function SalesInvoiceDialog({ buyers, products }: SalesInvoiceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة فاتورة مبيعات</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>إضافة فاتورة مبيعات</SheetTitle>
            <SheetDescription>
              الحفظ يخصم المنتجات النهائية من المخزون ويسجل تكلفة البيع من طبقات FIFO.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SalesInvoiceForm
              buyers={buyers}
              products={products}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
