import { ProductionBatchDialog } from "@/components/production/production-batch-dialog";
import { ProductionBatchesTable } from "@/components/production/production-batches-table";
import { MetricCard } from "@/components/shared/metric-card";
import type { ProductsPageProps } from "@/app/_types/types.products";
import { formatProductsAmount } from "@/app/_utils/utils.products";
import { getIngredients } from "@/lib/api/ingredients";
import { getProducts } from "@/lib/api/products";
import { getProductionBatches } from "@/lib/api/production-batches";
import { getServerCookieHeader } from "@/lib/server-cookies";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const cookieHeader = await getServerCookieHeader();
  const [batches, products, ingredients] = await Promise.all([
    getProductionBatches(query, { cookieHeader }),
    getProducts(undefined, false, { cookieHeader }),
    getIngredients(undefined, false, { cookieHeader }),
  ]);
  const totalProduced = batches.reduce((sum, batch) => sum + batch.producedQuantity, 0);
  const totalCost = batches.reduce((sum, batch) => sum + batch.totalCost, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(251, 247, 237, 0.96) 0%, rgba(255, 255, 255, 1) 58%, rgba(246, 240, 228, 0.92) 100%)",
          borderColor: "color-mix(in srgb, var(--border) 82%, #b98c45 18%)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div className="grid gap-6 border-b px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-800/80">
                Production
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                التصنيع
              </h1>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                تسجيل تشغيلات الإنتاج التي تستهلك الخامات وتضيف رصيد المنتجات النهائية.
              </p>
            </div>

            <ProductionBatchDialog products={products} ingredients={ingredients} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="عدد التشغيلات" value={String(batches.length)} tone="paper" />
            <MetricCard label="إجمالي المنتج" value={formatProductsAmount(totalProduced)} tone="amber" />
            <MetricCard label="إجمالي التكلفة" value={formatProductsAmount(totalCost)} tone="slate" />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">سجل تشغيلات الإنتاج</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
              التكلفة محفوظة وقت الحفظ بناءً على متوسط تكلفة الخامات المتاح.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-white/80 backdrop-blur"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 88%, #d5c2a0 12%)",
            }}
          >
            <ProductionBatchesTable batches={batches} products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
