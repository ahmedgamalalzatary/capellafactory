"use client";

import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { Product } from "@capella/shared/products/product.types";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductionBatchesTableProps = {
  batches: ProductionBatch[];
  products: Product[];
};

function ProductionBatchCard({
  batch,
  productName,
  idx,
}: {
  batch: ProductionBatch;
  productName: string;
  idx: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {batch.batchCode}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{productName}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(batch.totalCost)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الكمية المنتجة</dt>
        <dd className="text-foreground">{batch.producedQuantity.toFixed(3)}</dd>
        <dt className="text-muted-foreground">تكلفة الوحدة</dt>
        <dd className="text-foreground">{formatAmount(batch.unitCost)}</dd>
        <dt className="text-muted-foreground">الخامات</dt>
        <dd className="text-foreground">{batch.lines.length}</dd>
      </dl>
      <Link
        href={`/products/production-batches/${batch.id}`}
        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
      >
        عرض
      </Link>
    </div>
  );
}

export function ProductionBatchesTable({ batches, products }: ProductionBatchesTableProps) {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">كود التشغيلة</TableHead>
              <TableHead className="text-center">المنتج</TableHead>
              <TableHead className="text-center">الكمية المنتجة</TableHead>
              <TableHead className="text-center">إجمالي التكلفة</TableHead>
              <TableHead className="text-center">تكلفة الوحدة</TableHead>
              <TableHead className="text-center">الخامات</TableHead>
              <TableHead className="text-center">اخرى</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch, idx) => (
              <TableRow key={batch.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-center font-medium">{batch.batchCode}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {productsById.get(batch.productId)?.name ?? `#${batch.productId}`}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {batch.producedQuantity.toFixed(3)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(batch.totalCost)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(batch.unitCost)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {batch.lines.length}
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/products/production-batches/${batch.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
                  >
                    عرض
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {batches.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد تشغيلات إنتاج بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    احفظ أول تشغيلة لتحويل الخامات إلى رصيد منتج نهائي.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {batches.map((batch, idx) => (
          <ProductionBatchCard
            key={batch.id}
            batch={batch}
            productName={productsById.get(batch.productId)?.name ?? `#${batch.productId}`}
            idx={idx}
          />
        ))}

        {batches.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد تشغيلات إنتاج بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              احفظ أول تشغيلة لتحويل الخامات إلى رصيد منتج نهائي.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
