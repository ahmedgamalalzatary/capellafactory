import { IngredientDialog } from "@/components/inventory/ingredient-dialog";
import { InventorySearchInput } from "@/components/inventory/inventory-search-input";
import { IngredientsTable } from "@/components/inventory/ingredients-table";
import { ProductDialog } from "@/components/inventory/product-dialog";
import { ProductsTable } from "@/components/inventory/products-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getIngredients } from "@/lib/api/ingredients";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getProducts } from "@/lib/api/products";
import {
  filterIngredientsByUnitFamily,
  normalizeIngredientUnitFilter,
  type IngredientUnitFilter,
} from "@/lib/inventory";

type InventoryPageProps = {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    archived?: string;
    unitFamily?: string;
  }>;
};

const tabs = [
  { key: "ingredients", label: "الخامات" },
  { key: "products", label: "المنتجات النهائية" },
] as const;

const ingredientUnitFilters: { key: IngredientUnitFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "weight", label: "وزن" },
  { key: "volume", label: "حجم" },
  { key: "count", label: "عدد" },
];

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = params.tab === "products" ? "products" : "ingredients";
  const query = params.q?.trim() || undefined;
  const showArchived = params.archived === "true";
  const ingredientUnitFilter = normalizeIngredientUnitFilter(params.unitFamily);

  const cookieHeader = await getServerCookieHeader();
  const [ingredients, products] = await Promise.all([
    getIngredients(query, showArchived, { cookieHeader }),
    getProducts(query, showArchived, { cookieHeader }),
  ]);
  const visibleIngredients = filterIngredientsByUnitFamily(ingredients, ingredientUnitFilter);

  const activeCount = activeTab === "ingredients" ? visibleIngredients.length : products.length;
  const archivedCount =
    activeTab === "ingredients"
      ? visibleIngredients.filter((item) => item.isArchived).length
      : products.filter((item) => item.isArchived).length;
  const withHistoryCount =
    activeTab === "ingredients"
      ? visibleIngredients.filter((item) => item.hasHistory).length
      : products.filter((item) => item.hasHistory).length;

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
                Inventory Foundation
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px]">
                المخزون
              </h1>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                شاشة تأسيس الكتالوج التشغيلي للخامات والمنتجات النهائية. من هنا تبدأ
                أسماء السجلات الموحّدة التي ستعتمد عليها المشتريات، الإنتاج، والمبيعات.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "ingredients" ? <IngredientDialog /> : <ProductDialog />}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="السجلات المعروضة" value={String(activeCount)} tone="paper" />
            <MetricCard label="المؤرشف منها" value={String(archivedCount)} tone="slate" />
            <MetricCard label="لها تاريخ حركات" value={String(withHistoryCount)} tone="amber" />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <a
                    key={tab.key}
                    href={buildInventoryHref({
                      tab: tab.key,
                      q: query,
                      archived: showArchived,
                      unitFamily: tab.key === "ingredients" ? ingredientUnitFilter : "all",
                    })}
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-slate-950 text-white shadow-sm"
                        : "bg-white/75 text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <InventorySearchInput
                initialQuery={query}
                placeholder={activeTab === "ingredients" ? "ابحث باسم خام" : "ابحث باسم منتج"}
              />

              {activeTab === "ingredients" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      {`الوحدة: ${ingredientUnitFilters.find((filter) => filter.key === ingredientUnitFilter)?.label ?? "الكل"}`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    {ingredientUnitFilters.map((filter) => (
                      <DropdownMenuItem asChild key={filter.key}>
                        <a
                          href={buildInventoryHref({
                            tab: "ingredients",
                            q: query,
                            archived: showArchived,
                            unitFamily: filter.key,
                          })}
                        >
                          {filter.label}
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <a
                href={buildInventoryHref({
                  tab: activeTab,
                  q: query,
                  archived: !showArchived,
                })}
                className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold ${
                  showArchived
                    ? "border-amber-300 bg-amber-100 text-amber-950"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {showArchived ? "إخفاء المؤرشف" : "إظهار المؤرشف"}
              </a>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[24px] border bg-white/80 backdrop-blur"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 88%, #d5c2a0 12%)",
            }}
          >
            <div className="border-b bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,244,237,0.92)_100%)] px-4 py-4 sm:px-6">
              <h2 className="text-[16px] font-semibold text-slate-900">
                {activeTab === "ingredients" ? "كتالوج الخامات" : "كتالوج المنتجات النهائية"}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                {activeTab === "ingredients"
                  ? "إدارة الأسماء الموحّدة للخامات وعائلة الوحدة الأساسية لكل مادة."
                  : "إدارة المنتجات النهائية التي سيُبنى عليها الإنتاج والمبيعات لاحقًا."}
              </p>
            </div>

            {activeTab === "ingredients" ? (
              <IngredientsTable ingredients={visibleIngredients} />
            ) : (
              <ProductsTable products={products} />
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

function buildInventoryHref({
  tab,
  q,
  archived,
  unitFamily,
}: {
  tab: "ingredients" | "products";
  q?: string;
  archived: boolean;
  unitFamily?: IngredientUnitFilter;
}) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (q) {
    params.set("q", q);
  }

  if (archived) {
    params.set("archived", "true");
  }

  if (tab === "ingredients" && unitFamily && unitFamily !== "all") {
    params.set("unitFamily", unitFamily);
  }

  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}
