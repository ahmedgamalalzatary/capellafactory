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
import { deleteSupplier } from "@/api-client/suppliers";
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

export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10 text-start">#</TableHead>
          <TableHead className="text-start">الاسم</TableHead>
          <TableHead className="text-start">الهاتف</TableHead>
          <TableHead className="text-start">الموقع</TableHead>
          <TableHead className="text-start">الملاحظات</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier, idx) => (
          <TableRow
            key={supplier.id}
            className={idx % 2 === 1 ? "bg-muted/40" : ""}
          >
            <TableCell className="text-xs text-muted-foreground">
              {idx + 1}
            </TableCell>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell dir="ltr" className="text-start text-muted-foreground">
              {supplier.phone}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {supplier.where ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[28ch]">
              <span className="line-clamp-2">{supplier.notes}</span>
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
  );
}
