"use client";

import type { ProductionBatch } from "@capella/shared/production-batches/production-batch.types";
import type { Product } from "@capella/shared/products/product.types";
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

export function ProductionBatchesTable({ batches, products }: ProductionBatchesTableProps) {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-center">كود التشغيلة</TableHead>
          <TableHead className="text-center">المنتج</TableHead>
          <TableHead className="text-center">الكمية المنتجة</TableHead>
          <TableHead className="text-center">إجمالي التكلفة</TableHead>
          <TableHead className="text-center">تكلفة الوحدة</TableHead>
          <TableHead className="text-center">الخامات</TableHead>
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
          </TableRow>
        ))}

        {batches.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={6} className="py-20 text-center">
              <p className="text-sm font-medium">لا توجد تشغيلات إنتاج بعد</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                احفظ أول تشغيلة لتحويل الخامات إلى رصيد منتج نهائي.
              </p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
