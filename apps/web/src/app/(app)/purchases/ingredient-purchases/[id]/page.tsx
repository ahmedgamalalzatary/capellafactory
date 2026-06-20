import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getIngredientPurchase } from "@/lib/api/ingredient-purchases";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getIngredients } from "@/lib/api/ingredients";
import type { PaymentMethod, PaymentStatus } from "@capella/shared/payments/payment.types";

type IngredientPurchaseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IngredientPurchaseDetailPage({
  params,
}: IngredientPurchaseDetailPageProps) {
  const { id } = await params;
  const purchaseId = Number(id);

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    notFound();
  }

  const cookieHeader = await getServerCookieHeader();
  const [purchase, ingredients] = await Promise.all([
    getIngredientPurchase(purchaseId, { cookieHeader }).catch(() => null),
    getIngredients(undefined, false, { cookieHeader }).catch(() => []),
  ]);

  if (!purchase) {
    notFound();
  }

  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]));
  const total = purchase.totalAmount;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5">
        <Link
          href="/purchases?tab=ingredient-purchases"
          className="inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition hover:bg-accent"
        >
          رجوع لفواتير الخامات
        </Link>
      </div>

      <section className="overflow-hidden rounded-[28px] border bg-white">
        <div className="border-b px-5 py-6 sm:px-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800/80">
            Ingredient Purchase
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-slate-950">
                {purchase.invoiceCode}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{supplierLabel(purchase)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-90">
              <Metric label="عدد البنود" value={String(purchase.lines.length)} />
              <Metric label="الإجمالي" value={formatAmount(total)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
          <DetailItem label="وقت الفاتورة" value={formatDateTime(purchase.occurredAt)} />
          <DetailItem label="وقت التسجيل" value={formatDateTime(purchase.createdAt)} />
          <DetailItem label="ملاحظات" value={purchase.notes ?? "لا توجد"} />
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-slate-950">ملخص الدفع</h2>
              <p className="mt-1 text-sm text-slate-600">
                حالة الفاتورة: {paymentStatusLabel(purchase.paymentStatus)}
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Metric label="إجمالي الفاتورة" value={formatAmount(purchase.totalAmount)} />
            <Metric label="المدفوع" value={formatAmount(purchase.paidAmount)} />
            <Metric label="المتبقي" value={formatAmount(purchase.remainingAmount)} />
          </div>

          {purchase.payments.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-center">المبلغ المدفوع</TableHead>
                      <TableHead className="text-center">طريقة الدفع</TableHead>
                      <TableHead className="text-center">وقت الدفع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-center font-medium">
                          {formatAmount(payment.amount)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {paymentMethodLabel(payment.paymentMethod)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatDateTime(payment.paidAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y overflow-hidden rounded-2xl border sm:hidden">
                {purchase.payments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-600">
              لا توجد دفعات مسجلة لهذه الفاتورة
            </div>
          )}
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <h2 className="mb-4 text-[17px] font-bold text-slate-950">بنود الفاتورة</h2>
          <div className="hidden sm:block overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">الخامة</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">الكمية الأساسية</TableHead>
                  <TableHead className="text-center">سعر الوحدة</TableHead>
                  <TableHead className="text-center">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-center font-medium">
                      {ingredientNames.get(line.ingredientId) ?? `خامة #${line.ingredientId}`}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatQuantity(line.quantity)} {line.unit}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatQuantity(line.normalizedQuantity)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y sm:hidden overflow-hidden rounded-2xl border">
            {purchase.lines.map((line, idx) => (
              <IngredientPurchaseLineCard
                key={line.id}
                line={line}
                ingredientName={ingredientNames.get(line.ingredientId) ?? `خامة #${line.ingredientId}`}
                idx={idx}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function IngredientPurchaseLineCard({
  line,
  ingredientName,
  idx,
}: {
  line: {
    quantity: number;
    unit: string;
    normalizedQuantity: number;
    unitPrice: number;
    lineTotal: number;
  };
  ingredientName: string;
  idx: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {ingredientName}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatQuantity(line.quantity)} {line.unit}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(line.lineTotal)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الكمية الأساسية</dt>
        <dd className="text-foreground">{formatQuantity(line.normalizedQuantity)}</dd>
        <dt className="text-muted-foreground">سعر الوحدة</dt>
        <dd className="text-foreground">{formatAmount(line.unitPrice)}</dd>
      </dl>
    </div>
  );
}

function PaymentCard({
  payment,
}: {
  payment: {
    amount: number;
    paymentMethod: PaymentMethod;
    paidAt: string;
  };
}) {
  return (
    <div className="bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{formatAmount(payment.amount)}</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {paymentMethodLabel(payment.paymentMethod)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(payment.paidAt)}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-bold leading-none text-slate-950">{value}</p>
    </div>
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

function supplierLabel(purchase: { supplierId?: number; supplierName?: string }) {
  if (purchase.supplierName) {
    return purchase.supplierName;
  }

  return purchase.supplierId ? `مورد محفوظ #${purchase.supplierId}` : "مورد محفوظ";
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
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

function paymentMethodLabel(value: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    visa: "Visa",
    vodafone_cash: "Vodafone Cash",
    cod: "COD",
    instapay: "Instapay",
  };

  return labels[value];
}

function paymentStatusLabel(value: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "غير مدفوعة",
    partial: "مدفوعة جزئياً",
    paid: "مدفوعة بالكامل",
  };

  return labels[value];
}
