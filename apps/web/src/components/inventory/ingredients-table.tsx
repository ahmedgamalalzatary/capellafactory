"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import {
  archiveIngredient,
  deleteIngredient,
  reactivateIngredient,
} from "@/lib/api/ingredients";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IngredientForm } from "./ingredient-form";

type IngredientsTableProps = {
  ingredients: Ingredient[];
};

function StatusBadge({
  tone,
  children,
}: {
  tone: "amber" | "slate" | "green";
  children: string;
}) {
  const palette = {
    amber: "bg-amber-100 text-amber-900 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-100 text-emerald-900 border-emerald-200",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette[tone]}`}
    >
      {children}
    </span>
  );
}

function getIngredientFamilyLabel(unitFamily: Ingredient["unitFamily"]) {
  if (unitFamily === "weight") {
    return "وزن";
  }

  if (unitFamily === "volume") {
    return "حجم";
  }

  return "عدد";
}

function getIngredientFamilyTone(unitFamily: Ingredient["unitFamily"]) {
  if (unitFamily === "weight") {
    return "green" as const;
  }

  if (unitFamily === "volume") {
    return "amber" as const;
  }

  return "slate" as const;
}

function RowActions({ ingredient }: { ingredient: Ingredient }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: "archive" | "reactivate" | "delete") {
    setIsSubmitting(true);

    try {
      if (action === "archive") {
        await archiveIngredient(ingredient.id);
        toast.success("تمت أرشفة الخام بنجاح");
      } else if (action === "reactivate") {
        await reactivateIngredient(ingredient.id);
        toast.success("تمت إعادة تفعيل الخام بنجاح");
      } else {
        await deleteIngredient(ingredient.id);
        setDeleteOpen(false);
        toast.success("تم حذف الخام بنجاح");
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تنفيذ العملية. حاول مجددًا.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canArchive = ingredient.stockQuantity === 0 && !ingredient.isArchived;
  const canDelete = ingredient.stockQuantity === 0 && !ingredient.hasHistory;
  const canEdit = !ingredient.hasHistory;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="خيارات الخام"
            disabled={isSubmitting}
          >
            <span className="text-base">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canEdit} onClick={() => setEditOpen(true)}>
            تعديل
          </DropdownMenuItem>
          {!ingredient.isArchived ? (
            <DropdownMenuItem disabled={!canArchive} onClick={() => runAction("archive")}>
              أرشفة
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => runAction("reactivate")}>
              إعادة تفعيل
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!canDelete}
            onClick={() => setDeleteOpen(true)}
          >
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>تعديل خام</SheetTitle>
            <SheetDescription>
              يسمح بالتعديل فقط قبل وجود أي تاريخ حركات لهذا الخام.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <IngredientForm
              ingredientId={ingredient.id}
              initialValues={ingredient}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => setEditOpen(false)}
              submitLabel="تحديث الخام"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الخام</DialogTitle>
            <DialogDescription>
              الحذف متاح فقط إذا كان المخزون صفرًا ولا يوجد تاريخ مرتبط.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">السجل المستهدف</p>
            <p className="text-sm font-semibold">{ingredient.name}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => runAction("delete")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "جارٍ الحذف…" : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IngredientCard({ ingredient, idx }: { ingredient: Ingredient; idx: number }) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {ingredient.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={getIngredientFamilyTone(ingredient.unitFamily)}>
              {getIngredientFamilyLabel(ingredient.unitFamily)}
            </StatusBadge>
            <StatusBadge tone={ingredient.isArchived ? "slate" : "green"}>
              {ingredient.isArchived ? "مؤرشف" : "نشط"}
            </StatusBadge>
          </div>
        </div>
        <div className="flex-shrink-0">
          <RowActions ingredient={ingredient} />
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الوحدة الأساسية</dt>
        <dd className="text-foreground">{ingredient.baseUnit}</dd>
        <dt className="text-muted-foreground">الرصيد</dt>
        <dd className="text-foreground">{ingredient.stockQuantity.toFixed(3)}</dd>
        <dt className="text-muted-foreground">التاريخ</dt>
        <dd className="text-foreground">{ingredient.hasHistory ? "موجود" : "لا يوجد"}</dd>
      </dl>
    </div>
  );
}

export function IngredientsTable({ ingredients }: IngredientsTableProps) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="text-center">الخامة</TableHead>
              <TableHead className="text-center">العائلة</TableHead>
              <TableHead className="text-center">الوحدة الأساسية</TableHead>
              <TableHead className="text-center">الرصيد</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الحركات</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient, idx) => (
              <TableRow key={ingredient.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-xs text-muted-foreground text-center">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium text-center">{ingredient.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {getIngredientFamilyLabel(ingredient.unitFamily)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {ingredient.baseUnit}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {ingredient.stockQuantity.toFixed(3)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge tone={ingredient.isArchived ? "slate" : "green"}>
                    {ingredient.isArchived ? "مؤرشف" : "نشط"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {ingredient.hasHistory ? "موجود" : "لا يوجد"}
                </TableCell>
                <TableCell>
                  <RowActions ingredient={ingredient} />
                </TableCell>
              </TableRow>
            ))}

            {ingredients.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد خامات بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بإضافة أول مادة خام إلى الكتالوج.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {ingredients.map((ingredient, idx) => (
          <IngredientCard key={ingredient.id} ingredient={ingredient} idx={idx} />
        ))}
        {ingredients.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد خامات بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بإضافة أول مادة خام إلى الكتالوج.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
