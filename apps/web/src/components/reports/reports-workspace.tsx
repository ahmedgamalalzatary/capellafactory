"use client";

import Link from "next/link";
import { useMemo } from "react";
import { expenseTypeLabels } from "@capella/shared/expenses/expense.constants";
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

export function ReportsWorkspace({
  data,
  activeTab,
  activeRange = "all",
}: ReportsWorkspaceProps) {
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
            {renderActiveTable(activeTab, data, tableId, summary)}
          </div>
        </div>
      </section>
    </div>
  );
}

function renderActiveTable(
  activeTab: ReportsTabKey,
  data: ReportsData,
  tableId: string,
  summary: ReturnType<typeof summarizeReports>,
) {
  if (activeTab === "overview") {
    return <OverviewTable tableId={tableId} data={data} summary={summary} />;
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

  if (activeTab === "supplier-debts") {
    return (
      <SimpleTable
        tableId={tableId}
        headers={["الكود", "المورد", "وقت الفاتورة", "الإجمالي", "المدفوع", "المتبقي", ""]}
        emptyText="لا توجد ديون موردين"
        rows={data.ingredientPurchases
          .filter((purchase) => purchase.remainingAmount > 0)
          .map((purchase) => [
            purchase.invoiceCode,
            purchase.supplierName ?? (purchase.supplierId ? `مورد محفوظ #${purchase.supplierId}` : "مورد محفوظ"),
            formatReportDateTime(purchase.occurredAt),
            formatReportAmount(purchase.totalAmount),
            formatReportAmount(purchase.paidAmount),
            formatReportAmount(purchase.remainingAmount),
            <ShowLink key="show" href={`/purchases/ingredient-purchases/${purchase.id}`} label={`عرض ${purchase.invoiceCode}`} />,
          ])}
      />
    );
  }

  if (activeTab === "buyer-debts") {
    const buyerNames = new Map(data.buyers.map((buyer) => [buyer.id, buyer.name]));

    return (
      <SimpleTable
        tableId={tableId}
        headers={["الكود", "المشتري", "وقت البيع", "الإجمالي", "المدفوع", "المتبقي", ""]}
        emptyText="لا توجد ديون مشترين"
        rows={data.salesInvoices
          .filter((invoice) => invoice.remainingAmount > 0)
          .map((invoice) => [
            invoice.invoiceCode,
            buyerNames.get(invoice.buyerId) ?? `مشتري #${invoice.buyerId}`,
            formatReportDateTime(invoice.occurredAt),
            formatReportAmount(invoice.subtotal),
            formatReportAmount(invoice.paidAmount),
            formatReportAmount(invoice.remainingAmount),
            <ShowLink key="show" href={`/sales/${invoice.id}`} label={`عرض ${invoice.invoiceCode}`} />,
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
