import { expenseTypeLabels } from "@capella/shared/expenses/expense.constants";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense } from "@/lib/api/expenses";

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

  const expense = await getExpense(expenseId).catch(() => null);

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
      </section>
    </main>
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
