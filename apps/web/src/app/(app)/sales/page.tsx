import { MetricCard } from "@/components/shared/metric-card";
import { SalesInvoiceDialog } from "@/components/sales/sales-invoice-dialog";
import { SalesInvoicesTable } from "@/components/sales/sales-invoices-table";
import { getBuyers } from "@/lib/api/buyers";
import { getProducts } from "@/lib/api/products";
import { getSalesInvoices } from "@/lib/api/sales-invoices";
import { getServerCookieHeader } from "@/lib/server-cookies";

type SalesPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const cookieHeader = await getServerCookieHeader();
  const [invoices, buyers, products] = await Promise.all([
    getSalesInvoices(query, { cookieHeader }),
    getBuyers(undefined, { cookieHeader }),
    getProducts(undefined, false, { cookieHeader }),
  ]);
  const subtotal = invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const grossProfit = invoices.reduce((sum, invoice) => sum + invoice.grossProfit, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(240, 249, 244, 0.96) 0%, rgba(255, 255, 255, 1) 56%, rgba(231, 245, 255, 0.9) 100%)",
          borderColor: "color-mix(in srgb, var(--border) 84%, #15803d 16%)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div className="grid gap-6 border-b px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-800/80">
                Sales
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                المبيعات
              </h1>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                تسجيل فواتير بيع المنتجات النهائية وخصمها من المخزون بتكلفة FIFO محفوظة وقت البيع.
              </p>
            </div>

            <SalesInvoiceDialog buyers={buyers} products={products} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="عدد الفواتير" value={String(invoices.length)} tone="paper" />
            <MetricCard label="إجمالي البيع" value={formatAmount(subtotal)} tone="amber" />
            <MetricCard label="إجمالي الربح" value={formatAmount(grossProfit)} tone="slate" />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">سجل فواتير المبيعات</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
              كل فاتورة ثابتة بعد الحفظ، وتظهر تكلفة البضاعة المباعة والربح المحسوب.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-white/80 backdrop-blur"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 88%, #bbf7d0 12%)",
            }}
          >
            <SalesInvoicesTable invoices={invoices} buyers={buyers} products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
