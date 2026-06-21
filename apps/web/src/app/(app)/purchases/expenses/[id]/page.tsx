import type { PaymentMethod, PaymentStatus } from "@capella/shared/payments/payment.types";
import { expenseTypeLabels } from "@capella/shared/expenses/expense.constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense } from "@/lib/api/expenses";
import { getServerCookieHeader } from "@/lib/server-cookies";

type ExpenseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { id } = await params;
  const expenseId = Number(id);

  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    notFound();
  }

  const cookieHeader = await getServerCookieHeader();
  const expense = await getExpense(expenseId, { cookieHeader }).catch(() => null);

  if (!expense) {
    notFound();
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5">
        <Link
          href="/purchases?tab=expenses"
          className="inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition hover:bg-accent"
        >
          رجوع للمصروفات
        </Link>
      </div>

      <section className="overflow-hidden rounded-[28px] border bg-white">
        <div className="border-b px-5 py-6 sm:px-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800/80">
            Expense #{expense.id}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-slate-950">
                {expenseTypeLabels[expense.type]}
              </h1>
              <p className="mt-2 text-sm text-slate-600">تفاصيل سجل المصروف المدفوع.</p>
            </div>
            <p className="text-[30px] font-bold leading-none text-slate-950">
              {formatAmount(expense.amount)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-8">
          <DetailItem label="وقت الدفع" value={formatDateTime(expense.occurredAt)} />
          <DetailItem label="وقت التسجيل" value={formatDateTime(expense.createdAt)} />
          <DetailItem label="تفصيل المصروف" value={expenseDetailLabel(expense)} />
          <DetailItem label="ملاحظات" value={expense.notes ?? "لا توجد"} />
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <div className="mb-4">
            <h2 className="text-[17px] font-bold text-slate-950">الملخص المالي</h2>
            <p className="mt-1 text-sm text-slate-600">
              القيم الأساسية والضريبة والخصم والإجمالي النهائي وحالة السداد.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="الإجمالي الأساسي" value={formatAmount(expense.baseTotal)} />
            <Metric label="قيمة الضريبة" value={formatAmount(expense.taxAmount)} />
            <Metric label="بعد الضريبة" value={formatAmount(expense.totalAfterTax)} />
            <Metric label="قيمة الخصم" value={formatAmount(expense.discountAmount)} />
            <Metric label="الإجمالي النهائي" value={formatAmount(expense.finalTotal)} />
            <Metric label="حالة الدفع" value={paymentStatusLabel(expense.paymentStatus)} />
            <Metric label="المدفوع" value={formatAmount(expense.paidAmount)} />
            <Metric label="المتبقي" value={formatAmount(expense.remainingAmount)} />
          </div>
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <div className="mb-4">
            <h2 className="text-[17px] font-bold text-slate-950">سجل الدفعات</h2>
            <p className="mt-1 text-sm text-slate-600">كل الدفعات الجزئية المسجلة على هذا المصروف.</p>
          </div>

          {expense.payments.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-center">المبلغ المدفوع</TableHead>
                      <TableHead className="text-center">طريقة الدفع</TableHead>
                      <TableHead className="text-center">وقت الدفع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expense.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-center font-medium">
                          {formatAmount(payment.amount)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {paymentMethodLabel(payment.paymentMethod)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatDateTime(payment.paidAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y overflow-hidden rounded-2xl border sm:hidden">
                {expense.payments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-600">
              لا توجد دفعات مسجلة لهذا المصروف
            </div>
          )}
        </div>
      </section>
    </main>
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

function PaymentCard({
  payment,
}: {
  payment: {
    amount: number;
    paymentMethod: PaymentMethod;
    paidAt: string;
  };
}) {
  return (
    <div className="bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{formatAmount(payment.amount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">طريقة الدفع</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {paymentMethodLabel(payment.paymentMethod)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(payment.paidAt)}</p>
    </div>
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

function paymentMethodLabel(value: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    visa: "Visa",
    vodafone_cash: "Vodafone Cash",
    cod: "COD",
    instapay: "Instapay",
  };

  return labels[value];
}

function paymentStatusLabel(value: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "غير مدفوع",
    partial: "مدفوع جزئياً",
    paid: "مدفوع بالكامل",
  };

  return labels[value];
}
