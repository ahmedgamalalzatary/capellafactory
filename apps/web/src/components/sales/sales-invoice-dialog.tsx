"use client";

import { useCallback, useState } from "react";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import { listLocalDraftEntries } from "@/lib/local-drafts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createEmptySalesInvoiceDraft,
  getSalesInvoiceDraftLabel,
  isSalesInvoiceDraft,
  salesInvoiceDraftStorageKey,
  SalesInvoiceForm,
  type SalesInvoiceDraft,
} from "./sales-invoice-form";

type SalesInvoiceDialogProps = {
  buyers: Buyer[];
  products: Product[];
};

export function SalesInvoiceDialog({ buyers, products }: SalesInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [formSeed, setFormSeed] = useState<{
    draftId: string | null;
    initialDraft: SalesInvoiceDraft | null;
    key: number;
  }>({
    draftId: null,
    initialDraft: null,
    key: 0,
  });
  const [, setDraftsVersion] = useState(0);
  const drafts = listLocalDraftEntries(salesInvoiceDraftStorageKey, isSalesInvoiceDraft);

  const handleDraftsChange = useCallback(() => {
    setDraftsVersion((current) => current + 1);
  }, []);

  function openFreshForm() {
    setFormSeed({
      draftId: null,
      initialDraft: createEmptySalesInvoiceDraft(products, buyers),
      key: Date.now(),
    });
    setOpen(true);
  }

  function openSavedDraft(draftId: string, draft: SalesInvoiceDraft) {
    setFormSeed({ draftId, initialDraft: draft, key: Date.now() });
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={openFreshForm}>+ إضافة فاتورة مبيعات</Button>
        {drafts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">استرجاع</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {drafts.map((draft, index) => (
                <DropdownMenuItem key={draft.id} onClick={() => openSavedDraft(draft.id, draft.data)}>
                  {`مسودة #${drafts.length - index} - ${getSalesInvoiceDraftLabel(draft.data, buyers)}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

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
              key={formSeed.key}
              buyers={buyers}
              products={products}
              draftId={formSeed.draftId}
              initialDraft={formSeed.initialDraft}
              draftStorageKey={salesInvoiceDraftStorageKey}
              onDraftsChange={handleDraftsChange}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
