import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type IngredientPurchasesTableProps = {
  purchases: IngredientPurchase[];
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatOccurredAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function supplierLabel(purchase: IngredientPurchase) {
  if (purchase.supplierName) {
    return purchase.supplierName;
  }

  if (purchase.supplierId) {
    return `مورد محفوظ #${purchase.supplierId}`;
  }

  return "مورد غير محدد";
}

function IngredientPurchaseCard({ purchase, idx }: { purchase: IngredientPurchase; idx: number }) {
  const total = purchase.lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {purchase.invoiceCode}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{supplierLabel(purchase)}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(total)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">عدد البنود</dt>
        <dd className="text-foreground">{purchase.lines.length}</dd>
        <dt className="text-muted-foreground">وقت الفاتورة</dt>
        <dd className="text-foreground">{formatOccurredAt(purchase.occurredAt)}</dd>
      </dl>
      <Link
        href={`/purchases/ingredient-purchases/${purchase.id}`}
        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
      >
        عرض
      </Link>
    </div>
  );
}

export function IngredientPurchasesTable({ purchases }: IngredientPurchasesTableProps) {
  return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">الكود</TableHead>
              <TableHead className="text-center">المورد</TableHead>
              <TableHead className="text-center">عدد البنود</TableHead>
              <TableHead className="text-center">إجمالي الفاتورة</TableHead>
              <TableHead className="text-center">وقت الفاتورة</TableHead>
              <TableHead className="text-center">اخرى</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => {
              const total = purchase.lines.reduce((sum, line) => sum + line.lineTotal, 0);

              return (
                <TableRow key={purchase.id}>
                  <TableCell className="text-center font-medium">{purchase.invoiceCode}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {supplierLabel(purchase)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {purchase.lines.length}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatAmount(total)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatOccurredAt(purchase.occurredAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={`/purchases/ingredient-purchases/${purchase.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
                    >
                      عرض
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}

            {purchases.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد فواتير شراء خامات بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بإضافة أول فاتورة لرفع مخزون الخامات.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {purchases.map((purchase, idx) => (
          <IngredientPurchaseCard key={purchase.id} purchase={purchase} idx={idx} />
        ))}
        {purchases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد فواتير شراء خامات بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بإضافة أول فاتورة لرفع مخزون الخامات.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
