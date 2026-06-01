"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@capella/shared/products/product.types";
import { archiveProduct, deleteProduct, reactivateProduct } from "@/lib/api/products";
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
import { ProductForm } from "./product-form";

type ProductsTableProps = {
  products: Product[];
};

function StatusBadge({ archived }: { archived: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        archived
          ? "bg-slate-100 text-slate-700 border-slate-200"
          : "bg-emerald-100 text-emerald-900 border-emerald-200"
      }`}
    >
      {archived ? "مؤرشف" : "نشط"}
    </span>
  );
}

function RowActions({ product }: { product: Product }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: "archive" | "reactivate" | "delete") {
    setIsSubmitting(true);

    try {
      if (action === "archive") {
        await archiveProduct(product.id);
        toast.success("تمت أرشفة المنتج بنجاح");
      } else if (action === "reactivate") {
        await reactivateProduct(product.id);
        toast.success("تمت إعادة تفعيل المنتج بنجاح");
      } else {
        await deleteProduct(product.id);
        setDeleteOpen(false);
        toast.success("تم حذف المنتج بنجاح");
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تنفيذ العملية. حاول مجددًا.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canArchive = product.stockQuantity === 0 && !product.isArchived;
  const canDelete = product.stockQuantity === 0 && !product.hasHistory;
  const canEdit = !product.hasHistory;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="خيارات المنتج"
            disabled={isSubmitting}
          >
            <span className="text-base">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canEdit} onClick={() => setEditOpen(true)}>
            تعديل
          </DropdownMenuItem>
          {!product.isArchived ? (
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
            <SheetTitle>تعديل منتج</SheetTitle>
            <SheetDescription>
              يسمح بالتعديل فقط قبل وجود أي تاريخ حركات لهذا المنتج.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductForm
              productId={product.id}
              initialValues={product}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => setEditOpen(false)}
              submitLabel="تحديث المنتج"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف المنتج</DialogTitle>
            <DialogDescription>
              الحذف متاح فقط إذا كان الرصيد صفرًا ولا يوجد تاريخ مرتبط.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">السجل المستهدف</p>
            <p className="text-sm font-semibold">{product.name}</p>
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

function ProductCard({ product, idx }: { product: Product; idx: number }) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {product.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge archived={product.isArchived} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <RowActions product={product} />
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الرصيد</dt>
        <dd className="text-foreground">{product.stockQuantity.toFixed(3)}</dd>
        <dt className="text-muted-foreground">متوسط التكلفة</dt>
        <dd className="text-foreground">{product.averageUnitCost.toFixed(6)}</dd>
        <dt className="text-muted-foreground">التاريخ</dt>
        <dd className="text-foreground">{product.hasHistory ? "موجود" : "لا يوجد"}</dd>
      </dl>
    </div>
  );
}

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="text-center">المنتج</TableHead>
              <TableHead className="text-center">الرصيد</TableHead>
              <TableHead className="text-center">متوسط التكلفة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الحركات</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, idx) => (
              <TableRow key={product.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-xs text-muted-foreground text-center">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium text-center">{product.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.stockQuantity.toFixed(3)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.averageUnitCost.toFixed(6)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge archived={product.isArchived} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.hasHistory ? "موجود" : "لا يوجد"}
                </TableCell>
                <TableCell>
                  <RowActions product={product} />
                </TableCell>
              </TableRow>
            ))}

            {products.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد منتجات بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بإضافة أول منتج نهائي إلى الكتالوج.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} idx={idx} />
        ))}
        {products.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد منتجات بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بإضافة أول منتج نهائي إلى الكتالوج.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
