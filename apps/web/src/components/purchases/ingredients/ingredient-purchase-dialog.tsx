"use client";

import { useCallback, useState } from "react";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
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
  createEmptyIngredientPurchaseDraft,
  getIngredientPurchaseDraftLabel,
  IngredientPurchaseForm,
  ingredientPurchaseDraftStorageKey,
  isIngredientPurchaseDraft,
  type IngredientPurchaseDraft,
} from "../ingredients/ingredient-purchase-form";

type IngredientPurchaseDialogProps = {
  suppliers: Supplier[];
  ingredients: Ingredient[];
};

export function IngredientPurchaseDialog({
  suppliers,
  ingredients,
}: IngredientPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formSeed, setFormSeed] = useState<{
    draftId: string | null;
    initialDraft: IngredientPurchaseDraft | null;
    key: number;
  }>({
    draftId: null,
    initialDraft: null,
    key: 0,
  });
  const [, setDraftsVersion] = useState(0);
  const drafts = listLocalDraftEntries(ingredientPurchaseDraftStorageKey, isIngredientPurchaseDraft);

  const handleDraftsChange = useCallback(() => {
    setDraftsVersion((current) => current + 1);
  }, []);

  function openFreshForm() {
    setFormSeed({
      draftId: null,
      initialDraft: createEmptyIngredientPurchaseDraft(ingredients, suppliers),
      key: Date.now(),
    });
    setOpen(true);
  }

  function openSavedDraft(draftId: string, draft: IngredientPurchaseDraft) {
    setFormSeed({ draftId, initialDraft: draft, key: Date.now() });
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={openFreshForm}>+ إضافة فاتورة خامات</Button>
        {drafts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">استرجاع</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {drafts.map((draft, index) => (
                <DropdownMenuItem key={draft.id} onClick={() => openSavedDraft(draft.id, draft.data)}>
                  {`مسودة #${drafts.length - index} - ${getIngredientPurchaseDraftLabel(draft.data, suppliers)}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

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
              key={formSeed.key}
              suppliers={suppliers}
              ingredients={ingredients}
              draftId={formSeed.draftId}
              initialDraft={formSeed.initialDraft}
              draftStorageKey={ingredientPurchaseDraftStorageKey}
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
