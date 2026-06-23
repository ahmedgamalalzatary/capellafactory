import type {
  ReportsData,
  ReportsDateFilter,
  ReportsTabKey,
} from "@/app/types/types.reports";

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

export function getReportTabs() {
  return reportTabs;
}

export function normalizeReportsTab(value?: string): ReportsTabKey {
  return reportTabs.some((tab) => tab.key === value) ? (value as ReportsTabKey) : "overview";
}

export function buildReportsHref(tab: ReportsTabKey, dates?: ReportsDateFilter) {
  const params = new URLSearchParams({ tab });

  if (dates?.from) {
    params.set("from", dates.from);
  }

  if (dates?.to) {
    params.set("to", dates.to);
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

export function normalizeReportsDateFilter(
  params: {
    from?: string;
    to?: string;
  },
  now = new Date(),
): ReportsDateFilter {
  const today = toDateInputValue(now);
  const from = normalizeDateInput(params.from);
  const to = normalizeDateInput(params.to);

  if (!from && !to) {
    return {};
  }

  let normalizedFrom = from;
  let normalizedTo = to;

  if (normalizedFrom && !normalizedTo) {
    normalizedTo = today;
  } else if (!normalizedFrom && normalizedTo) {
    normalizedFrom = normalizedTo;
  }

  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    return {
      from: normalizedTo,
      to: normalizedFrom,
    };
  }

  return {
    from: normalizedFrom,
    to: normalizedTo,
  };
}

export function filterReportsDataByCreatedAt(
  data: ReportsData,
  filter: ReportsDateFilter,
): ReportsData {
  if (!filter.from || !filter.to) {
    return data;
  }

  const cutoff = new Date(`${filter.from}T00:00:00.000Z`);
  const end = new Date(`${filter.to}T23:59:59.999Z`);

  const isInRange = (value?: string) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return date >= cutoff && date <= end;
  };

  return {
    buyers: data.buyers.filter((row) => isInRange(row.createdAt)),
    suppliers: data.suppliers.filter((row) => isInRange(row.createdAt)),
    ingredients: data.ingredients.filter((row) => isInRange(row.createdAt)),
    products: data.products.filter((row) => isInRange(row.createdAt)),
    expenses: data.expenses.filter((row) => isInRange(row.occurredAt)),
    ingredientPurchases: data.ingredientPurchases.filter((row) => isInRange(row.occurredAt)),
    purchaseCorrections: data.purchaseCorrections.filter((row) => isInRange(row.createdAt)),
    productionBatches: data.productionBatches.filter((row) => isInRange(row.occurredAt)),
    salesInvoices: data.salesInvoices.filter((row) => isInRange(row.occurredAt)),
  };
}

function normalizeDateInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return trimmed;
}

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
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
