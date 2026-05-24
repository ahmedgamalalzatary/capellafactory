"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "./supplier-form";
import { deleteSupplier } from "@/lib/api/suppliers";
import { toast } from "sonner";

type SuppliersTableProps = {
  suppliers: Supplier[];
};

function RowActions({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    setIsDeleting(true);
    try {
      await deleteSupplier(supplier.id);
      setDeleteOpen(false);
      router.refresh();
      toast.success("تم حذف المورد بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف. حاول مجددًا.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="خيارات المورد"
          >
            <span className="text-base">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            تعديل
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>تعديل مورد</SheetTitle>
            <SheetDescription>
              حدّث بيانات الاتصال والمعلومات التشغيلية للمورد.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SupplierForm
              supplierId={supplier.id}
              initialValues={supplier}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => setEditOpen(false)}
              submitLabel="تحديث المورد"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              سيتم حذف بيانات المورد نهائيًا. لا يمكن التراجع عن هذه العملية.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">السجل المستهدف</p>
            <p className="text-sm font-semibold">{supplier.name}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? "جارٍ الحذف…" : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SupplierCard({ supplier, idx }: { supplier: Supplier; idx: number }) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">
              #{idx + 1}
            </span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {supplier.name}
            </h3>
          </div>
          <p dir="ltr" className="text-start text-[13px] text-muted-foreground">
            {supplier.phone}
          </p>
        </div>
        <div className="flex-shrink-0">
          <RowActions supplier={supplier} />
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الموقع</dt>
        <dd className="text-foreground">{supplier.where ?? "—"}</dd>
        <dt className="text-muted-foreground">الملاحظات</dt>
        <dd className="text-foreground">
          <span className="line-clamp-2">{supplier.notes ?? "—"}</span>
        </dd>
      </dl>
    </div>
  );
}

export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="text-center">الاسم</TableHead>
              <TableHead className="text-center">الهاتف</TableHead>
              <TableHead className="text-center">الموقع</TableHead>
              <TableHead className="text-center">الملاحظات</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier, idx) => (
              <TableRow
                key={supplier.id}
                className={idx % 2 === 1 ? "bg-muted/40" : ""}
              >
                <TableCell className="text-xs text-muted-foreground text-center">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium text-center">{supplier.name}</TableCell>
                <TableCell dir="ltr" className="text-center text-muted-foreground">
                  {supplier.phone}
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {supplier.where ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[28ch] text-center">
                  <span className="line-clamp-2">{supplier.notes ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <RowActions supplier={supplier} />
                </TableCell>
              </TableRow>
            ))}

            {suppliers.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm font-medium">لا يوجد موردون بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بإضافة أول مورد إلى السجل.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {suppliers.map((supplier, idx) => (
          <SupplierCard key={supplier.id} supplier={supplier} idx={idx} />
        ))}
        {suppliers.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا يوجد موردون بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بإضافة أول مورد إلى السجل.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
