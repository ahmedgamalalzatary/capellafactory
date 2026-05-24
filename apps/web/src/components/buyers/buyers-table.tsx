"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
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
import { BuyerForm } from "./buyer-form";
import { deleteBuyer } from "@/lib/api/buyers";
import { toast } from "sonner";

type BuyersTableProps = {
  buyers: Buyer[];
};

function RowActions({ buyer }: { buyer: Buyer }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    setIsDeleting(true);
    try {
      await deleteBuyer(buyer.id);
      setDeleteOpen(false);
      router.refresh();
      toast.success("تم حذف المشتري بنجاح");
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
          <Button variant="ghost" size="icon-sm" aria-label="خيارات المشتري">
            <span className="text-base">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>تعديل</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="left" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>تعديل مشتري</SheetTitle>
            <SheetDescription>
              حدّث بيانات الاتصال والمعلومات التشغيلية للمشتري.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <BuyerForm
              buyerId={buyer.id}
              initialValues={buyer}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => setEditOpen(false)}
              submitLabel="تحديث المشتري"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              سيتم حذف بيانات المشتري نهائيًا. لا يمكن التراجع عن هذه العملية.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">السجل المستهدف</p>
            <p className="text-sm font-semibold">{buyer.name}</p>
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

export function BuyersTable({ buyers }: BuyersTableProps) {
  return (
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
        {buyers.map((buyer, idx) => (
          <TableRow key={buyer.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
            <TableCell className="text-xs text-muted-foreground text-center">
              {idx + 1}
            </TableCell>
            <TableCell className="font-medium text-center">{buyer.name}</TableCell>
            <TableCell dir="ltr" className="text-center text-muted-foreground">
              {buyer.phone}
            </TableCell>
            <TableCell className="text-muted-foreground text-center">
              {buyer.where ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[28ch] text-center">
              <span className="line-clamp-2">{buyer.notes ?? "—"}</span>
            </TableCell>
            <TableCell>
              <RowActions buyer={buyer} />
            </TableCell>
          </TableRow>
        ))}

        {buyers.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={6} className="py-20 text-center">
              <p className="text-sm font-medium">لا يوجد مشترون بعد</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                ابدأ بإضافة أول مشتري إلى السجل.
              </p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
