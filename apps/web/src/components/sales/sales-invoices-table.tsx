"use client";

import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import type { SalesInvoice } from "@capella/shared/sales-invoices/sales-invoice.types";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SalesInvoicesTableProps = {
  invoices: SalesInvoice[];
  buyers: Buyer[];
  products: Product[];
};

function SalesInvoiceCard({
  invoice,
  buyerName,
  idx,
}: {
  invoice: SalesInvoice;
  buyerName: string;
  idx: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {invoice.invoiceCode}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{buyerName}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(invoice.subtotal)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الربح</dt>
        <dd className="text-foreground">{formatAmount(invoice.grossProfit)}</dd>
        <dt className="text-muted-foreground">التكلفة</dt>
        <dd className="text-foreground">{formatAmount(invoice.totalCost)}</dd>
        <dt className="text-muted-foreground">البنود</dt>
        <dd className="text-foreground">{invoice.lines.length}</dd>
      </dl>
      <Link
        href={`/sales/${invoice.id}`}
        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
      >
        عرض
      </Link>
    </div>
  );
}

export function SalesInvoicesTable({ invoices, buyers, products }: SalesInvoicesTableProps) {
  const buyersById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">كود الفاتورة</TableHead>
              <TableHead className="text-center">المشتري</TableHead>
              <TableHead className="text-center">الإجمالي</TableHead>
              <TableHead className="text-center">التكلفة</TableHead>
              <TableHead className="text-center">الربح</TableHead>
              <TableHead className="text-center">المنتجات</TableHead>
              <TableHead className="text-center">اخرى</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, idx) => (
              <TableRow key={invoice.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-center font-medium">{invoice.invoiceCode}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {buyersById.get(invoice.buyerId)?.name ?? `#${invoice.buyerId}`}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(invoice.subtotal)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(invoice.totalCost)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(invoice.grossProfit)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {invoice.lines
                    .map((line) => productsById.get(line.productId)?.name ?? `#${line.productId}`)
                    .slice(0, 2)
                    .join("، ")}
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/sales/${invoice.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
                  >
                    عرض
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {invoices.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد فواتير مبيعات بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    احفظ أول فاتورة لتقليل رصيد المنتجات النهائية.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {invoices.map((invoice, idx) => (
          <SalesInvoiceCard
            key={invoice.id}
            invoice={invoice}
            buyerName={buyersById.get(invoice.buyerId)?.name ?? `#${invoice.buyerId}`}
            idx={idx}
          />
        ))}

        {invoices.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد فواتير مبيعات بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              احفظ أول فاتورة لتقليل رصيد المنتجات النهائية.
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
