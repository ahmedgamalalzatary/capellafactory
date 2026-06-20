import type { ReportsData, ReportsRangeKey, ReportsTabKey } from "@/app/types/types.reports";

type ReportTab = {
  key: ReportsTabKey;
  label: string;
};

const reportTabs: readonly ReportTab[] = [
  { key: "overview", label: "نظرة عامة" },
  { key: "expenses", label: "المصاريف" },
  { key: "ingredient-purchases", label: "فواتير الخامات" },
  { key: "purchase-corrections", label: "عكس الشراء" },
  { key: "production-batches", label: "تشغيلات الإنتاج" },
  { key: "sales", label: "المبيعات" },
  { key: "supplier-debts", label: "ديون الموردين" },
  { key: "buyer-debts", label: "ديون المشترين" },
] as const;

type ReportRange = {
  key: ReportsRangeKey;
  label: string;
};

const reportRanges: readonly ReportRange[] = [
  { key: "all", label: "كل الوقت" },
  { key: "last-30-days", label: "آخر 30 يوم" },
  { key: "last-7-days", label: "آخر 7 أيام" },
  { key: "last-day", label: "آخر يوم" },
] as const;

export function getReportTabs() {
  return reportTabs;
}

export function getReportRanges() {
  return reportRanges;
}

export function normalizeReportsTab(value?: string): ReportsTabKey {
  return reportTabs.some((tab) => tab.key === value) ? (value as ReportsTabKey) : "overview";
}

export function normalizeReportsRange(value?: string): ReportsRangeKey {
  return reportRanges.some((range) => range.key === value) ? (value as ReportsRangeKey) : "all";
}

export function buildReportsHref(tab: ReportsTabKey, range: ReportsRangeKey = "all") {
  const params = new URLSearchParams({ tab });

  if (range !== "all") {
    params.set("range", range);
  }

  return `/reports?${params.toString()}`;
}

export function buildReportDownloadName(tab: ReportsTabKey) {
  return `capella-${tab}-report.pdf`;
}

export function summarizeReports(data: ReportsData) {
  const expensesTotal = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const ingredientPurchasesTotal = data.ingredientPurchases.reduce(
    (sum, purchase) =>
      sum + purchase.lines.reduce((lineSum, line) => lineSum + line.lineTotal, 0),
    0,
  );
  const purchaseCorrectionsTotal = data.purchaseCorrections.reduce(
    (sum, correction) =>
      sum + correction.lines.reduce((lineSum, line) => lineSum + line.lineTotal, 0),
    0,
  );
  const productionCostTotal = data.productionBatches.reduce(
    (sum, batch) => sum + batch.totalCost,
    0,
  );
  const salesTotal = data.salesInvoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const supplierDebtTotal = data.ingredientPurchases.reduce(
    (sum, purchase) => sum + purchase.remainingAmount,
    0,
  );
  const buyerDebtTotal = data.salesInvoices.reduce(
    (sum, invoice) => sum + invoice.remainingAmount,
    0,
  );
  const grossProfitTotal = data.salesInvoices.reduce(
    (sum, invoice) => sum + invoice.grossProfit,
    0,
  );
  const currentProductStockValue = data.products.reduce(
    (sum, product) => sum + product.stockQuantity * product.averageUnitCost,
    0,
  );

  return {
    peopleCount: data.buyers.length + data.suppliers.length,
    catalogCount: data.ingredients.length + data.products.length,
    expensesTotal,
    ingredientPurchasesTotal,
    purchaseCorrectionsTotal,
    productionCostTotal,
    salesTotal,
    supplierDebtTotal,
    buyerDebtTotal,
    grossProfitTotal,
    currentProductStockValue,
    netAfterExpenses: grossProfitTotal - expensesTotal,
  };
}

export function filterReportsDataByCreatedAt(
  data: ReportsData,
  range: ReportsRangeKey,
  now = new Date(),
): ReportsData {
  if (range === "all") {
    return data;
  }

  const cutoff = new Date(now);

  if (range === "last-day") {
    cutoff.setDate(cutoff.getDate() - 1);
  } else if (range === "last-7-days") {
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff.setDate(cutoff.getDate() - 30);
  }

  const isInRange = (row: { createdAt?: string }) => {
    if (!row.createdAt) {
      return false;
    }

    const createdAt = new Date(row.createdAt);
    return createdAt >= cutoff && createdAt <= now;
  };

  return {
    buyers: data.buyers.filter(isInRange),
    suppliers: data.suppliers.filter(isInRange),
    ingredients: data.ingredients.filter(isInRange),
    products: data.products.filter(isInRange),
    expenses: data.expenses.filter(isInRange),
    ingredientPurchases: data.ingredientPurchases.filter(isInRange),
    purchaseCorrections: data.purchaseCorrections.filter(isInRange),
    productionBatches: data.productionBatches.filter(isInRange),
    salesInvoices: data.salesInvoices.filter(isInRange),
  };
}

export function formatReportAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatReportQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatReportDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
