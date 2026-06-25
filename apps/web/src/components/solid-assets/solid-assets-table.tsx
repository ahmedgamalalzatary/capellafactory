"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolidAssetWithTotalPrice } from "@capella/shared/solid-assets/solid-asset.types";
import { deleteSolidAsset } from "@/lib/api/solid-assets";
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SolidAssetForm } from "./solid-asset-form";

type SolidAssetsTableProps = {
  assets: SolidAssetWithTotalPrice[];
};

type SolidAssetTableRow = SolidAssetWithTotalPrice;

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function RowActions({ asset }: { asset: SolidAssetTableRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    setIsDeleting(true);
    try {
      await deleteSolidAsset(asset.id);
      setDeleteOpen(false);
      router.refresh();
      toast.success("تم حذف الأصل بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل الحذف. حاول مجددًا.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="خيارات الأصل">
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
            <SheetTitle>تعديل أصل ثابت</SheetTitle>
            <SheetDescription>حدّث بيانات الأصل الثابت.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SolidAssetForm
              assetId={asset.id}
              initialValues={asset}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => setEditOpen(false)}
              submitLabel="تحديث الأصل"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              سيتم حذف هذا الأصل الثابت نهائيًا. لا يمكن التراجع عن هذه العملية.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 px-4 py-3">
            <p className="mb-0.5 text-xs text-muted-foreground">السجل المستهدف</p>
            <p className="text-sm font-semibold">{asset.name}</p>
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

function SolidAssetCard({ asset, idx }: { asset: SolidAssetTableRow; idx: number }) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {asset.name}
            </h3>
          </div>
        </div>
        <div className="shrink-0">
          <RowActions asset={asset} />
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الكمية</dt>
        <dd className="text-foreground">{asset.qty}</dd>
        <dt className="text-muted-foreground">سعر الواحدة</dt>
        <dd className="text-foreground">{formatAmount(asset.priceOfOne)}</dd>
        <dt className="text-muted-foreground">الإجمالي</dt>
        <dd className="text-foreground">{formatAmount(asset.totalPrice)}</dd>
      </dl>
    </div>
  );
}

export function SolidAssetsTable({ assets }: SolidAssetsTableProps) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="text-center">الاسم</TableHead>
              <TableHead className="text-center">الكمية</TableHead>
              <TableHead className="text-center">سعر الواحدة</TableHead>
              <TableHead className="text-center">الإجمالي</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset, idx) => (
              <TableRow key={asset.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="text-center font-medium">{asset.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">{asset.qty}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(asset.priceOfOne)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(asset.totalPrice)}
                </TableCell>
                <TableCell>
                  <RowActions asset={asset} />
                </TableCell>
              </TableRow>
            ))}

            {assets.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد أصول ثابتة بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بإضافة أول أصل ثابت إلى السجل.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {assets.map((asset, idx) => (
          <SolidAssetCard key={asset.id} asset={asset} idx={idx} />
        ))}
        {assets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد أصول ثابتة بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بإضافة أول أصل ثابت إلى السجل.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
