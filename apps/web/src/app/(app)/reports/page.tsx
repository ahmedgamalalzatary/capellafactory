import type { ReportsPageProps } from "@/app/types/types.reports";
import {
  filterReportsDataByCreatedAt,
  normalizeReportsDateFilter,
  normalizeReportsTab,
} from "@/app/utils/utils.reports";
import { ReportsWorkspace } from "@/components/reports/reports-workspace";
import { getBuyers } from "@/lib/api/buyers";
import { getExpenses } from "@/lib/api/expenses";
import { getIngredientPurchases } from "@/lib/api/ingredient-purchases";
import { getIngredients } from "@/lib/api/ingredients";
import { getProducts } from "@/lib/api/products";
import { getProductionBatches } from "@/lib/api/production-batches";
import { getPurchaseCorrections } from "@/lib/api/purchase-corrections";
import { getSalesInvoices } from "@/lib/api/sales-invoices";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getSuppliers } from "@/lib/api/suppliers";

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = normalizeReportsTab(params.tab);
  const activeDateFilter = normalizeReportsDateFilter(params);
  const cookieHeader = await getServerCookieHeader();
  const [
    buyers,
    suppliers,
    ingredients,
    products,
    expenses,
    ingredientPurchases,
    purchaseCorrections,
    productionBatches,
    salesInvoices,
  ] = await Promise.all([
    getBuyers(undefined, { cookieHeader }),
    getSuppliers(undefined, { cookieHeader }),
    getIngredients(undefined, true, { cookieHeader }),
    getProducts(undefined, true, { cookieHeader }),
    getExpenses(undefined, { cookieHeader }),
    getIngredientPurchases(undefined, { cookieHeader }),
    getPurchaseCorrections(undefined, { cookieHeader }),
    getProductionBatches(undefined, { cookieHeader }),
    getSalesInvoices(undefined, { cookieHeader }),
  ]);

  const data = filterReportsDataByCreatedAt(
    {
      buyers,
      suppliers,
      ingredients,
      products,
      expenses,
      ingredientPurchases,
      purchaseCorrections,
      productionBatches,
      salesInvoices,
    },
    activeDateFilter,
  );

  return (
    <ReportsWorkspace
      activeTab={activeTab}
      activeFrom={activeDateFilter.from}
      activeTo={activeDateFilter.to}
      data={data}
    />
  );
}
