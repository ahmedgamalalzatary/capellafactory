import Link from "next/link";
import { notFound } from "next/navigation";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import type { SalesInvoiceLine } from "@capella/shared/sales-invoices/sales-invoice.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBuyers } from "@/lib/api/buyers";
import { getProducts } from "@/lib/api/products";
import { getSalesInvoice } from "@/lib/api/sales-invoices";
import { getServerCookieHeader } from "@/lib/server-cookies";

type SalesInvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SalesInvoiceDetailPage({ params }: SalesInvoiceDetailPageProps) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    notFound();
  }

  const cookieHeader = await getServerCookieHeader();
  const [invoice, buyers, products] = await Promise.all([
    getSalesInvoice(invoiceId, { cookieHeader }).catch(() => null),
    getBuyers(undefined, { cookieHeader }).catch((): Buyer[] => []),
    getProducts(undefined, true, { cookieHeader }).catch((): Product[] => []),
  ]);

  if (!invoice) {
    notFound();
  }

  const buyerName =
    buyers.find((buyer) => buyer.id === invoice.buyerId)?.name ?? `مشتري #${invoice.buyerId}`;
  const productNames = new Map(products.map((product) => [product.id, product.name]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5">
        <Link
          href="/sales"
          className="inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition hover:bg-accent"
        >
          رجوع للمبيعات
        </Link>
      </div>

      <section className="overflow-hidden rounded-[28px] border bg-white">
        <div className="border-b px-5 py-6 sm:px-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800/80">
            Sales Invoice
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-slate-950">
                {invoice.invoiceCode}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{buyerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-105">
              <Metric label="إجمالي البيع" value={formatAmount(invoice.subtotal)} />
              <Metric label="إجمالي الربح" value={formatAmount(invoice.grossProfit)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
          <DetailItem label="وقت البيع" value={formatDateTime(invoice.occurredAt)} />
          <DetailItem label="وقت التسجيل" value={formatDateTime(invoice.createdAt)} />
          <DetailItem label="تكلفة البضاعة" value={formatAmount(invoice.totalCost)} />
          <DetailItem label="عدد المنتجات" value={String(invoice.lines.length)} />
          <DetailItem label="المشتري" value={buyerName} />
          <DetailItem label="ملاحظات" value={invoice.notes ?? "لا توجد"} />
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <h2 className="mb-4 text-[17px] font-bold text-slate-950">المنتجات المباعة</h2>
          <div className="hidden sm:block overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">المنتج</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">سعر البيع</TableHead>
                  <TableHead className="text-center">إجمالي البيع</TableHead>
                  <TableHead className="text-center">تكلفة FIFO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line: SalesInvoiceLine) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-center font-medium">
                      {productNames.get(line.productId) ?? `منتج #${line.productId}`}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {line.quantity.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.sellingUnitPrice)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.lineTotal)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.lineCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y sm:hidden overflow-hidden rounded-2xl border">
            {invoice.lines.map((line: SalesInvoiceLine, idx: number) => (
              <SalesInvoiceLineCard
                key={line.id}
                line={line}
                productName={productNames.get(line.productId) ?? `منتج #${line.productId}`}
                idx={idx}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SalesInvoiceLineCard({
  line,
  productName,
  idx,
}: {
  line: SalesInvoiceLine;
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
              {productName}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{line.quantity.toFixed(0)} قطعة</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(line.lineTotal)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">سعر البيع</dt>
        <dd className="text-foreground">{formatAmount(line.sellingUnitPrice)}</dd>
        <dt className="text-muted-foreground">تكلفة الوحدة</dt>
        <dd className="text-foreground">{formatAmount(line.unitCost)}</dd>
        <dt className="text-muted-foreground">تكلفة البند</dt>
        <dd className="text-foreground">{formatAmount(line.lineCost)}</dd>
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-bold leading-none text-slate-950">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/70 px-4 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-[15px] font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
