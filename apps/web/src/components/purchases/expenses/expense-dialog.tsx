"use client";

import { useCallback, useState } from "react";
import { listLocalDraftEntries } from "@/lib/local-drafts";
import {
  createEmptyExpenseDraft,
  expenseDraftStorageKey,
  ExpenseForm,
  getExpenseDraftLabel,
  isExpenseDraft,
  type ExpenseDraft,
} from "./expense-form";
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

export function ExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [formSeed, setFormSeed] = useState<{ draftId: string | null; initialDraft: ExpenseDraft | null; key: number }>({
    draftId: null,
    initialDraft: null,
    key: 0,
  });
  const [, setDraftsVersion] = useState(0);
  const drafts = listLocalDraftEntries(expenseDraftStorageKey, isExpenseDraft);

  const handleDraftsChange = useCallback(() => {
    setDraftsVersion((current) => current + 1);
  }, []);

  function openFreshForm() {
    setFormSeed({ draftId: null, initialDraft: createEmptyExpenseDraft(), key: Date.now() });
    setOpen(true);
  }

  function openSavedDraft(draftId: string, draft: ExpenseDraft) {
    setFormSeed({ draftId, initialDraft: draft, key: Date.now() });
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={openFreshForm}>+ إضافة مصروف</Button>
        {drafts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">استرجاع</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {drafts.map((draft, index) => (
                <DropdownMenuItem
                  key={draft.id}
                  onClick={() => openSavedDraft(draft.id, draft.data)}
                >
                  {`مسودة #${drafts.length - index} - ${getExpenseDraftLabel(draft.data)}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

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
              key={formSeed.key}
              draftId={formSeed.draftId}
              initialDraft={formSeed.initialDraft}
              draftStorageKey={expenseDraftStorageKey}
              onDraftsChange={handleDraftsChange}
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
