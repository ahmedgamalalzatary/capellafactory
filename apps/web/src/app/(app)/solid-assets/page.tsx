import { SolidAssetDialog } from "@/components/solid-assets/solid-asset-dialog";
import { SolidAssetsSearchInput } from "@/components/solid-assets/solid-assets-search-input";
import { SolidAssetsTable } from "@/components/solid-assets/solid-assets-table";
import { MetricCard } from "@/components/shared/metric-card";
import { getSolidAssets } from "@/lib/api/solid-assets";
import { getServerCookieHeader } from "@/lib/server-cookies";

type SolidAssetsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export default async function SolidAssetsPage({ searchParams }: SolidAssetsPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const cookieHeader = await getServerCookieHeader();
  const assets = await getSolidAssets(query, { cookieHeader });
  const totalQty = assets.reduce((sum, asset) => sum + asset.qty, 0);
  const totalValue = assets.reduce((sum, asset) => sum + asset.totalPrice, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(248, 245, 238, 0.96) 0%, rgba(255, 255, 255, 1) 58%, rgba(241, 235, 224, 0.92) 100%)",
          borderColor: "color-mix(in srgb, var(--border) 82%, #8a6b3d 18%)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div className="grid gap-6 border-b px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-800/80">
                Solid Assets
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                الأصول الثابتة
              </h1>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                شاشة مستقلة لتسجيل الأصول الموجودة بالمكان مع الكمية وسعر الواحدة والإجمالي المحسوب تلقائيًا.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SolidAssetDialog />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="عدد السجلات" value={String(assets.length)} tone="paper" />
            <MetricCard label="إجمالي الكميات" value={String(totalQty)} tone="slate" />
            <MetricCard label="القيمة الإجمالية" value={formatAmount(totalValue)} tone="amber" />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900">سجل الأصول الثابتة</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                ابحث داخل أسماء الأصول، ثم أضف أو عدّل أو احذف أي سجل عند الحاجة.
              </p>
            </div>

            <SolidAssetsSearchInput initialQuery={query} />
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-white/80 backdrop-blur"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 88%, #d5c2a0 12%)",
            }}
          >
            <SolidAssetsTable assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}
