import { ExpenseDialog } from "@/components/purchases/expense-dialog";
import { IngredientPurchaseDialog } from "@/components/purchases/ingredient-purchase-dialog";
import { IngredientPurchasesTable } from "@/components/purchases/ingredient-purchases-table";
import { ExpensesTable } from "@/components/purchases/expenses-table";
import { PurchasesSearchInput } from "@/components/purchases/purchases-search-input";
import { getExpenses } from "@/lib/api/expenses";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getIngredientPurchases } from "@/lib/api/ingredient-purchases";
import { getIngredients } from "@/lib/api/ingredients";
import { getSuppliers } from "@/lib/api/suppliers";

type PurchasesPageProps = {
  searchParams?: Promise<{
    q?: string;
    tab?: string;
  }>;
};

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const activeTab = params.tab === "ingredient-purchases" ? "ingredient-purchases" : "expenses";
  const cookieHeader = await getServerCookieHeader();
  const [expenses, ingredientPurchases, suppliers, ingredients] = await Promise.all([
    getExpenses(query, { cookieHeader }),
    getIngredientPurchases(query, { cookieHeader }),
    getSuppliers(undefined, { cookieHeader }),
    getIngredients(undefined, false, { cookieHeader }),
  ]);
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const salaryCount = expenses.filter((expense) => expense.type === "salary").length;
  const otherCount = expenses.filter((expense) => expense.type === "other").length;
  const purchasesTotal = ingredientPurchases.reduce(
    (sum, purchase) => sum + purchase.lines.reduce((lineSum, line) => lineSum + line.lineTotal, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(250, 247, 240, 0.96) 0%, rgba(255, 255, 255, 1) 56%, rgba(242, 237, 226, 0.92) 100%)",
          borderColor: "color-mix(in srgb, var(--border) 82%, #9a7b44 18%)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div className="grid gap-6 border-b px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-800/80">
                Expenses
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                المشتريات
              </h1>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                شاشة تسجيل المصروفات التشغيلية المدفوعة فعليًا. هذه المرحلة تغطي
                المصروفات فقط، بدون مشتريات خامات وبدون أي تأثير على المخزون.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "expenses" ? (
                <ExpenseDialog />
              ) : (
                <IngredientPurchaseDialog suppliers={suppliers} ingredients={ingredients} />
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {activeTab === "expenses" ? (
              <>
                <MetricCard label="عدد السجلات" value={String(expenses.length)} tone="paper" />
                <MetricCard label="إجمالي المبالغ" value={formatAmount(totalAmount)} tone="amber" />
                <MetricCard
                  label="مرتبات / أخرى"
                  value={`${salaryCount} / ${otherCount}`}
                  tone="slate"
                />
              </>
            ) : (
              <>
                <MetricCard
                  label="عدد الفواتير"
                  value={String(ingredientPurchases.length)}
                  tone="paper"
                />
                <MetricCard label="إجمالي الشراء" value={formatAmount(purchasesTotal)} tone="amber" />
                <MetricCard label="الخامات المتاحة" value={String(ingredients.length)} tone="slate" />
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <a
                  href={buildPurchasesHref("expenses", query)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "expenses"
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                  }`}
                >
                  المصروفات
                </a>
                <a
                  href={buildPurchasesHref("ingredient-purchases", query)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "ingredient-purchases"
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                  }`}
                >
                  فواتير شراء الخامات
                </a>
              </div>
              <h2 className="text-[16px] font-semibold text-slate-900">
                {activeTab === "expenses" ? "سجل المصروفات" : "سجل فواتير شراء الخامات"}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                {activeTab === "expenses"
                  ? "ابحث داخل الأنواع، أسماء الموظفين، وصف الأنواع الحرة، أو الملاحظات."
                  : "ابحث داخل كود الفاتورة، اسم المورد المكتوب، أو ملاحظات الفاتورة."}
              </p>
            </div>

            <PurchasesSearchInput initialQuery={query} />
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-white/80 backdrop-blur"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 88%, #d5c2a0 12%)",
            }}
          >
            {activeTab === "expenses" ? (
              <ExpensesTable expenses={expenses} />
            ) : (
              <IngredientPurchasesTable purchases={ingredientPurchases} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "paper" | "slate" | "amber";
}) {
  const theme = {
    paper: {
      background: "rgba(255,255,255,0.74)",
      borderColor: "rgba(148, 163, 184, 0.20)",
      text: "text-slate-950",
      subtext: "text-slate-500",
    },
    slate: {
      background: "rgba(241, 245, 249, 0.86)",
      borderColor: "rgba(148, 163, 184, 0.26)",
      text: "text-slate-900",
      subtext: "text-slate-500",
    },
    amber: {
      background: "rgba(254, 243, 199, 0.62)",
      borderColor: "rgba(217, 119, 6, 0.18)",
      text: "text-amber-950",
      subtext: "text-amber-800/70",
    },
  } as const;

  return (
    <div
      className="rounded-[22px] border px-4 py-4 sm:px-5"
      style={{
        background: theme[tone].background,
        borderColor: theme[tone].borderColor,
      }}
    >
      <p className={`text-[11px] font-medium uppercase tracking-[0.18em] ${theme[tone].subtext}`}>
        {label}
      </p>
      <p className={`mt-3 text-[28px] font-bold leading-none ${theme[tone].text}`}>{value}</p>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function buildPurchasesHref(tab: "expenses" | "ingredient-purchases", q?: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (q) {
    params.set("q", q);
  }

  const query = params.toString();
  return query ? `/purchases?${query}` : "/purchases";
}
