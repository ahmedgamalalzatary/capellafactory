"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  buildReportsHref,
  formatReportAmount,
  formatReportDateTime,
} from "@/app/utils/utils.reports";

export type AccountInvoice = {
  id: number;
  invoiceCode: string;
  occurredAt: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  href: string;
};

export function AccountInvoicesTable({
  title,
  summaryLabel,
  invoices,
}: {
  title: string;
  summaryLabel: string;
  invoices: AccountInvoice[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesCode = normalized
        ? invoice.invoiceCode.toLowerCase().includes(normalized)
        : true;

      return matchesCode;
    });
  }, [invoices, query]);
  const totalRemaining = filtered.reduce((sum, invoice) => sum + invoice.remainingAmount, 0);

  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-8">
      <div className="rounded-[28px] border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {summaryLabel}:{" "}
          <span className="font-bold text-slate-950">{formatReportAmount(totalRemaining)}</span>
        </p>
      </div>

      <div className="grid gap-3 rounded-[24px] border bg-white p-4">
        <Input
          placeholder="بحث بكود الفاتورة"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Link className="ms-auto text-sm font-semibold text-slate-600" href={buildReportsHref("overview")}>
            التقارير
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-3 text-center">الكود</th>
              <th className="p-3 text-center">التاريخ</th>
              <th className="p-3 text-center">الإجمالي</th>
              <th className="p-3 text-center">المدفوع</th>
              <th className="p-3 text-center">المتبقي</th>
              <th className="p-3 text-center">الحالة</th>
              <th className="p-3 text-center">الفاتورة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-b-0">
                <td className="p-3 text-center">{invoice.invoiceCode}</td>
                <td className="p-3 text-center">{formatReportDateTime(invoice.occurredAt)}</td>
                <td className="p-3 text-center">{formatReportAmount(invoice.totalAmount)}</td>
                <td className="p-3 text-center">{formatReportAmount(invoice.paidAmount)}</td>
                <td className="p-3 text-center font-semibold">
                  {formatReportAmount(invoice.remainingAmount)}
                </td>
                <td className="p-3 text-center">{invoice.paymentStatus}</td>
                <td className="p-3 text-center">
                  <Link className="font-semibold text-slate-700 underline" href={invoice.href}>
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="p-10 text-center text-slate-500" colSpan={7}>
                  لا توجد فواتير مطابقة
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
