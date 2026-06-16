"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { expenseTypeLabels } from "@capella/shared/expenses/expense.constants";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Product } from "@capella/shared/products/product.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportsData, ReportsRangeKey, ReportsTabKey } from "@/app/types/types.reports";
import {
  buildReportDownloadName,
  buildReportsHref,
  formatReportAmount,
  formatReportDateTime,
  formatReportQuantity,
  getReportRanges,
  getReportTabs,
  summarizeReports,
} from "@/app/utils/utils.reports";
import { MetricCard } from "@/components/shared/metric-card";
import { ReportPdfDownloadButton } from "./report-pdf-download-button";

type ReportsWorkspaceProps = {
  data: ReportsData;
  activeTab: ReportsTabKey;
  activeRange?: ReportsRangeKey;
};

type DetailRecord =
  | { type: "buyer"; row: Buyer }
  | { type: "supplier"; row: Supplier }
  | { type: "ingredient"; row: Ingredient }
  | { type: "product"; row: Product };

export function ReportsWorkspace({
  data,
  activeTab,
  activeRange = "all",
}: ReportsWorkspaceProps) {
  const [detail, setDetail] = useState<DetailRecord | null>(null);
  const summary = useMemo(() => summarizeReports(data), [data]);
  const activeLabel =
    getReportTabs().find((tab) => tab.key === activeTab)?.label ?? "نظرة عامة";
  const tableId = `report-table-${activeTab}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <section className="overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="grid gap-6 border-b bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,1)_54%,rgba(236,253,245,0.7))] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Reports
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                التقارير
              </h1>
              <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                مساحة قراءة واحدة لكل سجلات المصنع، بدون تعديل أو حذف. كل تبويب له جدول مستقل
                وتحميل PDF خاص به.
              </p>
            </div>

            <ReportPdfDownloadButton
              label="تحميل PDF"
              filename={buildReportDownloadName(activeTab)}
              tableId={tableId}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="الأشخاص" value={String(summary.peopleCount)} tone="paper" />
            <MetricCard label="إجمالي البيع" value={formatReportAmount(summary.salesTotal)} tone="amber" />
            <MetricCard label="إجمالي الربح" value={formatReportAmount(summary.grossProfitTotal)} tone="slate" />
            <MetricCard label="الصافي بعد المصاريف" value={formatReportAmount(summary.netAfterExpenses)} tone="paper" />
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-8">
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Report tabs">
            {getReportTabs().map((tab) => (
              <Link
                key={tab.key}
                href={buildReportsHref(tab.key, activeRange)}
                className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                  tab.key === activeTab
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-wrap gap-2" aria-label="Report date ranges">
            {getReportRanges().map((range) => (
              <Link
                key={range.key}
                href={buildReportsHref(activeTab, range.key)}
                className={`inline-flex h-9 items-center rounded-full border px-3 text-[13px] font-semibold transition ${
                  range.key === activeRange
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {range.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-950">{activeLabel}</h2>
              <p className="mt-1 text-[12px] text-slate-600">
                البيانات المهمة في الجدول، والتفاصيل الكاملة من زر عرض.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-white">
            {renderActiveTable(activeTab, data, tableId, setDetail, summary)}
          </div>
        </div>
      </section>

      <MasterDetailDialog detail={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  );
}

function renderActiveTable(
  activeTab: ReportsTabKey,
  data: ReportsData,
  tableId: string,
  setDetail: (detail: DetailRecord) => void,
  summary: ReturnType<typeof summarizeReports>,
) {
  if (activeTab === "overview") {
    return <OverviewTable tableId={tableId} data={data} summary={summary} />;
  }

  if (activeTab === "buyers") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الاسم", "الهاتف", "الموقع", "الملاحظات", "تاريخ التسجيل", ""]}
        emptyText="لا يوجد مشترون"
        rows={data.buyers.map((buyer) => [
          buyer.name,
          buyer.phone,
          buyer.where ?? "-",
          buyer.notes ?? "-",
          formatReportDateTime(buyer.createdAt),
          <Button key="show" variant="outline" size="sm" onClick={() => setDetail({ type: "buyer", row: buyer })}>
            {`عرض ${buyer.name}`}
          </Button>,
        ])}
      />
    );
  }

  if (activeTab === "suppliers") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الاسم", "الهاتف", "الموقع", "الملاحظات", "تاريخ التسجيل", ""]}
        emptyText="لا يوجد موردون"
        rows={data.suppliers.map((supplier) => [
          supplier.name,
          supplier.phone,
          supplier.where ?? "-",
          supplier.notes ?? "-",
          formatReportDateTime(supplier.createdAt),
          <Button key="show" variant="outline" size="sm" onClick={() => setDetail({ type: "supplier", row: supplier })}>
            {`عرض ${supplier.name}`}
          </Button>,
        ])}
      />
    );
  }

  if (activeTab === "ingredients") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الخامة", "العائلة", "الوحدة", "الرصيد", "الحالة", "تاريخ حركات", ""]}
        emptyText="لا توجد خامات"
        rows={data.ingredients.map((ingredient) => [
          ingredient.name,
          ingredientFamilyLabel(ingredient.unitFamily),
          ingredient.baseUnit,
          formatReportQuantity(ingredient.stockQuantity),
          ingredient.isArchived ? "مؤرشف" : "نشط",
          ingredient.hasHistory ? "موجود" : "لا يوجد",
          <Button key="show" variant="outline" size="sm" onClick={() => setDetail({ type: "ingredient", row: ingredient })}>
            {`عرض ${ingredient.name}`}
          </Button>,
        ])}
      />
    );
  }

  if (activeTab === "products") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["المنتج", "الرصيد", "متوسط التكلفة", "الحالة", "تاريخ حركات", ""]}
        emptyText="لا توجد منتجات"
        rows={data.products.map((product) => [
          product.name,
          formatReportQuantity(product.stockQuantity),
          formatReportAmount(product.averageUnitCost),
          product.isArchived ? "مؤرشف" : "نشط",
          product.hasHistory ? "موجود" : "لا يوجد",
          <Button key="show" variant="outline" size="sm" onClick={() => setDetail({ type: "product", row: product })}>
            {`عرض ${product.name}`}
          </Button>,
        ])}
      />
    );
  }

  if (activeTab === "expenses") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["النوع", "المبلغ", "وقت الدفع", "التفصيل", "الملاحظات", ""]}
        emptyText="لا توجد مصروفات"
        rows={data.expenses.map((expense) => [
          expenseTypeLabels[expense.type],
          formatReportAmount(expense.amount),
          formatReportDateTime(expense.occurredAt),
          expenseDetailLabel(expense),
          expense.notes ?? "-",
          <ShowLink key="show" href={`/purchases/expenses/${expense.id}`} label={`عرض ${expenseTypeLabels[expense.type]}`} />,
        ])}
      />
    );
  }

  if (activeTab === "ingredient-purchases") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الكود", "المورد", "وقت الفاتورة", "عدد البنود", "الإجمالي", ""]}
        emptyText="لا توجد فواتير خامات"
        rows={data.ingredientPurchases.map((purchase) => [
          purchase.invoiceCode,
          purchase.supplierName ?? (purchase.supplierId ? `مورد محفوظ #${purchase.supplierId}` : "مورد محفوظ"),
          formatReportDateTime(purchase.occurredAt),
          String(purchase.lines.length),
          formatReportAmount(purchase.lines.reduce((sum, line) => sum + line.lineTotal, 0)),
          <ShowLink key="show" href={`/purchases/ingredient-purchases/${purchase.id}`} label={`عرض ${purchase.invoiceCode}`} />,
        ])}
      />
    );
  }

  if (activeTab === "purchase-corrections") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الفاتورة الأصلية", "السبب", "عدد البنود", "إجمالي العكس", "وقت التسجيل", ""]}
        emptyText="لا توجد عمليات عكس"
        rows={data.purchaseCorrections.map((correction) => {
          const code = correction.sourcePurchaseInvoiceCode ?? `فاتورة #${correction.sourcePurchaseId}`;

          return [
            code,
            correction.reason,
            String(correction.lines.length),
            formatReportAmount(correction.lines.reduce((sum, line) => sum + line.lineTotal, 0)),
            formatReportDateTime(correction.createdAt),
            <ShowLink key="show" href={`/purchases/purchase-corrections/${correction.id}`} label={`عرض ${code}`} />,
          ];
        })}
      />
    );
  }

  if (activeTab === "production-batches") {
    const productNames = new Map(data.products.map((product) => [product.id, product.name]));

    return (
      <SimpleTable
        tableId={tableId}
        headers={[
          "الكود",
          "المنتج",
          "وقت الإنتاج",
          "الكمية",
          "عدد الخامات",
          "إجمالي التكلفة",
          "تكلفة الوحدة",
          "",
        ]}
        emptyText="لا توجد تشغيلات إنتاج"
        rows={data.productionBatches.map((batch) => [
          batch.batchCode,
          productNames.get(batch.productId) ?? `منتج #${batch.productId}`,
          formatReportDateTime(batch.occurredAt),
          formatReportQuantity(batch.producedQuantity),
          `${batch.lines.length} خامات`,
          formatReportAmount(batch.totalCost),
          formatReportAmount(batch.unitCost),
          <ShowLink
            key="show"
            href={`/products/production-batches/${batch.id}`}
            label={`عرض الوصفة ${batch.batchCode}`}
          />,
        ])}
      />
    );
  }

  const buyerNames = new Map(data.buyers.map((buyer) => [buyer.id, buyer.name]));

  return (
    <SimpleTable
      tableId={tableId}
      headers={["الكود", "المشتري", "وقت البيع", "إجمالي البيع", "التكلفة", "الربح", ""]}
      emptyText="لا توجد فواتير مبيعات"
      rows={data.salesInvoices.map((invoice) => [
        invoice.invoiceCode,
        buyerNames.get(invoice.buyerId) ?? `مشتري #${invoice.buyerId}`,
        formatReportDateTime(invoice.occurredAt),
        formatReportAmount(invoice.subtotal),
        formatReportAmount(invoice.totalCost),
        formatReportAmount(invoice.grossProfit),
        <ShowLink key="show" href={`/sales/${invoice.id}`} label={`عرض ${invoice.invoiceCode}`} />,
      ])}
    />
  );
}

function OverviewTable({
  tableId,
  data,
  summary,
}: {
  tableId: string;
  data: ReportsData;
  summary: ReturnType<typeof summarizeReports>;
}) {
  return (
    <SimpleTable
      tableId={tableId}
      headers={["المؤشر", "القيمة"]}
      emptyText=""
      rows={[
        ["المشترون", String(data.buyers.length)],
        ["الموردون", String(data.suppliers.length)],
        ["الخامات", String(data.ingredients.length)],
        ["المنتجات", String(data.products.length)],
        ["إجمالي المصاريف", formatReportAmount(summary.expensesTotal)],
        ["إجمالي شراء الخامات", formatReportAmount(summary.ingredientPurchasesTotal)],
        ["إجمالي عكس الشراء", formatReportAmount(summary.purchaseCorrectionsTotal)],
        ["إجمالي تكلفة الإنتاج", formatReportAmount(summary.productionCostTotal)],
        ["إجمالي المبيعات", formatReportAmount(summary.salesTotal)],
        ["إجمالي الربح", formatReportAmount(summary.grossProfitTotal)],
      ]}
    />
  );
}

function SimpleTable({
  tableId,
  headers,
  rows,
  emptyText,
}: {
  tableId: string;
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table id={tableId}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((header) => (
              <TableHead key={header} className="text-center">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} className={rowIndex % 2 === 1 ? "bg-muted/40" : ""}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="text-center text-muted-foreground">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={headers.length} className="py-16 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ShowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}

function MasterDetailDialog({
  detail,
  onOpenChange,
}: {
  detail: DetailRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const title =
    detail?.type === "buyer"
      ? "تفاصيل المشتري"
      : detail?.type === "supplier"
        ? "تفاصيل المورد"
        : detail?.type === "ingredient"
          ? "تفاصيل الخامة"
          : "تفاصيل المنتج";

  return (
    <Dialog open={Boolean(detail)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>عرض كامل للبيانات بدون أي إجراءات تعديل.</DialogDescription>
        </DialogHeader>
        {detail ? <DetailGrid detail={detail} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailGrid({ detail }: { detail: DetailRecord }) {
  if (detail.type === "ingredient") {
    const row = detail.row;

    return (
      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailItem label="الاسم" value={row.name} />
        <DetailItem label="العائلة" value={ingredientFamilyLabel(row.unitFamily)} />
        <DetailItem label="الوحدة الأساسية" value={row.baseUnit} />
        <DetailItem label="الرصيد" value={formatReportQuantity(row.stockQuantity)} />
        <DetailItem label="الحالة" value={row.isArchived ? "مؤرشف" : "نشط"} />
        <DetailItem label="تاريخ حركات" value={row.hasHistory ? "موجود" : "لا يوجد"} />
        <DetailItem label="تاريخ التسجيل" value={formatReportDateTime(row.createdAt)} />
        <DetailItem label="آخر تحديث" value={formatReportDateTime(row.updatedAt)} />
      </dl>
    );
  }

  if (detail.type === "product") {
    const row = detail.row;

    return (
      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailItem label="الاسم" value={row.name} />
        <DetailItem label="الرصيد" value={formatReportQuantity(row.stockQuantity)} />
        <DetailItem label="متوسط التكلفة" value={formatReportAmount(row.averageUnitCost)} />
        <DetailItem label="الحالة" value={row.isArchived ? "مؤرشف" : "نشط"} />
        <DetailItem label="تاريخ حركات" value={row.hasHistory ? "موجود" : "لا يوجد"} />
        <DetailItem label="تاريخ التسجيل" value={formatReportDateTime(row.createdAt)} />
        <DetailItem label="آخر تحديث" value={formatReportDateTime(row.updatedAt)} />
      </dl>
    );
  }

  const row = detail.row;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <DetailItem label="الاسم" value={row.name} />
      <DetailItem label="الهاتف" value={row.phone} />
      <DetailItem label="الموقع" value={row.where ?? "-"} />
      <DetailItem label="الملاحظات" value={row.notes ?? "-"} />
      <DetailItem label="تاريخ التسجيل" value={formatReportDateTime(row.createdAt)} />
      <DetailItem label="آخر تحديث" value={formatReportDateTime(row.updatedAt)} />
    </dl>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/70 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-[14px] font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ingredientFamilyLabel(value: Ingredient["unitFamily"]) {
  if (value === "weight") {
    return "وزن";
  }

  if (value === "volume") {
    return "حجم";
  }

  return "عدد";
}

function expenseDetailLabel(expense: {
  type: string;
  employeeName?: string;
  otherLabel?: string;
}) {
  if (expense.type === "salary") {
    return expense.employeeName ?? "مرتب بدون اسم موظف";
  }

  if (expense.type === "other") {
    return expense.otherLabel ?? "مصروف آخر";
  }

  return "مصروف عام";
}
