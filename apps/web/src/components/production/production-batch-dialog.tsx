"use client";

import { useCallback, useState } from "react";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
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
  createEmptyProductionBatchDraft,
  getProductionBatchDraftLabel,
  isProductionBatchDraft,
  productionBatchDraftStorageKey,
  ProductionBatchForm,
  type ProductionBatchDraft,
} from "./production-batch-form";

type ProductionBatchDialogProps = {
  products: Product[];
  ingredients: Ingredient[];
};

export function ProductionBatchDialog({ products, ingredients }: ProductionBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [formSeed, setFormSeed] = useState<{
    draftId: string | null;
    initialDraft: ProductionBatchDraft | null;
    key: number;
  }>({
    draftId: null,
    initialDraft: null,
    key: 0,
  });
  const [, setDraftsVersion] = useState(0);
  const drafts = listLocalDraftEntries(productionBatchDraftStorageKey, isProductionBatchDraft);

  const handleDraftsChange = useCallback(() => {
    setDraftsVersion((current) => current + 1);
  }, []);

  function openFreshForm() {
    setFormSeed({
      draftId: null,
      initialDraft: createEmptyProductionBatchDraft(products, ingredients),
      key: Date.now(),
    });
    setOpen(true);
  }

  function openSavedDraft(draftId: string, draft: ProductionBatchDraft) {
    setFormSeed({ draftId, initialDraft: draft, key: Date.now() });
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={openFreshForm}>+ إضافة تشغيلة إنتاج</Button>
        {drafts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">استرجاع</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {drafts.map((draft, index) => (
                <DropdownMenuItem key={draft.id} onClick={() => openSavedDraft(draft.id, draft.data)}>
                  {`مسودة #${drafts.length - index} - ${getProductionBatchDraftLabel(draft.data, products)}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

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
              key={formSeed.key}
              products={products}
              ingredients={ingredients}
              draftId={formSeed.draftId}
              initialDraft={formSeed.initialDraft}
              draftStorageKey={productionBatchDraftStorageKey}
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
