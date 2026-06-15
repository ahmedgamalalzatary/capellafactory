import { ExpenseDialog } from "@/components/purchases/expense-dialog";
import { IngredientPurchaseDialog } from "@/components/purchases/ingredient-purchase-dialog";
import { IngredientPurchasesTable } from "@/components/purchases/ingredient-purchases-table";
import { PurchaseCorrectionDialog } from "@/components/purchases/purchase-correction-dialog";
import { PurchaseCorrectionsTable } from "@/components/purchases/purchase-corrections-table";
import { ExpensesTable } from "@/components/purchases/expenses-table";
import { PurchasesSearchInput } from "@/components/purchases/purchases-search-input";
import { MetricCard } from "@/components/shared/metric-card";
import type { PurchasesPageProps } from "@/app/types/types.purchases";
import { buildPurchasesHref, formatPurchasesAmount } from "@/app/utils/utils.purchases";
import { getExpenses } from "@/lib/api/expenses";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getIngredientPurchases } from "@/lib/api/ingredient-purchases";
import { getIngredients } from "@/lib/api/ingredients";
import { getPurchaseCorrections } from "@/lib/api/purchase-corrections";
import { getSuppliers } from "@/lib/api/suppliers";
import type { IngredientPurchaseLine } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { PurchaseCorrectionLine } from "@capella/shared/purchase-corrections/purchase-correction.types";

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const activeTab =
    params.tab === "ingredient-purchases" || params.tab === "purchase-corrections"
      ? params.tab
      : "expenses";
  const cookieHeader = await getServerCookieHeader();
  const [expenses, ingredientPurchases, purchaseCorrections, suppliers, ingredients] = await Promise.all([
    getExpenses(query, { cookieHeader }),
    getIngredientPurchases(query, { cookieHeader }),
    getPurchaseCorrections(query, { cookieHeader }),
    getSuppliers(undefined, { cookieHeader }),
    getIngredients(undefined, false, { cookieHeader }),
  ]);
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const salaryCount = expenses.filter((expense) => expense.type === "salary").length;
  const otherCount = expenses.filter((expense) => expense.type === "other").length;
  const purchasesTotal = ingredientPurchases.reduce(
    (sum, purchase) =>
      sum +
      purchase.lines.reduce(
        (lineSum: number, line: IngredientPurchaseLine) => lineSum + line.lineTotal,
        0,
      ),
    0,
  );
  const correctionsTotal = purchaseCorrections.reduce(
    (sum, correction) =>
      sum +
      correction.lines.reduce(
        (lineSum: number, line: PurchaseCorrectionLine) => lineSum + line.lineTotal,
        0,
      ),
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
              ) : activeTab === "ingredient-purchases" ? (
                <IngredientPurchaseDialog suppliers={suppliers} ingredients={ingredients} />
              ) : (
                <PurchaseCorrectionDialog purchases={ingredientPurchases} ingredients={ingredients} />
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {activeTab === "expenses" ? (
              <>
                <MetricCard label="عدد السجلات" value={String(expenses.length)} tone="paper" />
                <MetricCard label="إجمالي المبالغ" value={formatPurchasesAmount(totalAmount)} tone="amber" />
                <MetricCard
                  label="مرتبات / أخرى"
                  value={`${salaryCount} / ${otherCount}`}
                  tone="slate"
                />
              </>
            ) : activeTab === "ingredient-purchases" ? (
              <>
                <MetricCard
                  label="عدد الفواتير"
                  value={String(ingredientPurchases.length)}
                  tone="paper"
                />
                <MetricCard label="إجمالي الشراء" value={formatPurchasesAmount(purchasesTotal)} tone="amber" />
                <MetricCard label="الخامات المتاحة" value={String(ingredients.length)} tone="slate" />
              </>
            ) : (
              <>
                <MetricCard label="عدد عمليات العكس" value={String(purchaseCorrections.length)} tone="paper" />
                <MetricCard label="إجمالي العكس" value={formatPurchasesAmount(correctionsTotal)} tone="amber" />
                <MetricCard
                  label="الفواتير المرجعية"
                  value={String(new Set(purchaseCorrections.map(c => c.sourcePurchaseId)).size)}
                  tone="slate"
                />
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
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "expenses"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                    }`}
                >
                  المصروفات
                </a>
                <a
                  href={buildPurchasesHref("ingredient-purchases", query)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "ingredient-purchases"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                    }`}
                >
                  فواتير شراء الخامات
                </a>
                <a
                  href={buildPurchasesHref("purchase-corrections", query)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "purchase-corrections"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                    }`}
                >
                  عكس الشراء
                </a>
              </div>
              <h2 className="text-[16px] font-semibold text-slate-900">
                {activeTab === "expenses"
                  ? "سجل المصروفات"
                  : activeTab === "ingredient-purchases"
                    ? "سجل فواتير شراء الخامات"
                    : "سجل عكس الشراء"}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                {activeTab === "expenses"
                  ? "ابحث داخل الأنواع، أسماء الموظفين، وصف الأنواع الحرة، أو الملاحظات."
                  : activeTab === "ingredient-purchases"
                    ? "ابحث داخل كود الفاتورة، اسم المورد المكتوب، أو ملاحظات الفاتورة."
                    : "ابحث داخل سبب العكس أو كود الفاتورة الأصلية."}
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
            ) : activeTab === "ingredient-purchases" ? (
              <IngredientPurchasesTable purchases={ingredientPurchases} />
            ) : (
              <PurchaseCorrectionsTable corrections={purchaseCorrections} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
