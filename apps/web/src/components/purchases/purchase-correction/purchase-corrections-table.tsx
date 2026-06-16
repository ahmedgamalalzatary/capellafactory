import type { PurchaseCorrection } from "@capella/shared/purchase-corrections/purchase-correction.types";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PurchaseCorrectionsTableProps = {
  corrections: PurchaseCorrection[];
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

function correctionTotal(correction: PurchaseCorrection) {
  return correction.lines.reduce((sum: number, line) => sum + line.lineTotal, 0);
}

function PurchaseCorrectionCard({
  correction,
  idx,
}: {
  correction: PurchaseCorrection;
  idx: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {correction.sourcePurchaseInvoiceCode ?? `فاتورة #${correction.sourcePurchaseId}`}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{correction.reason}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(correctionTotal(correction))}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">عدد البنود</dt>
        <dd className="text-foreground">{correction.lines.length}</dd>
        <dt className="text-muted-foreground">وقت التسجيل</dt>
        <dd className="text-foreground">{formatOccurredAt(correction.createdAt)}</dd>
      </dl>
      <Link
        href={`/purchases/purchase-corrections/${correction.id}`}
        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
      >
        عرض
      </Link>
    </div>
  );
}

export function PurchaseCorrectionsTable({ corrections }: PurchaseCorrectionsTableProps) {
  return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">الفاتورة الأصلية</TableHead>
              <TableHead className="text-center">السبب</TableHead>
              <TableHead className="text-center">عدد البنود</TableHead>
              <TableHead className="text-center">إجمالي العكس</TableHead>
              <TableHead className="text-center">وقت التسجيل</TableHead>
              <TableHead className="text-center">اخرى</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corrections.map((correction) => (
              <TableRow key={correction.id}>
                <TableCell className="text-center font-medium">
                  {correction.sourcePurchaseInvoiceCode ?? `فاتورة #${correction.sourcePurchaseId}`}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{correction.reason}</TableCell>
                <TableCell className="text-center text-muted-foreground">{correction.lines.length}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(correctionTotal(correction))}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatOccurredAt(correction.createdAt)}
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/purchases/purchase-corrections/${correction.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition hover:bg-accent"
                  >
                    عرض
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {corrections.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد عمليات عكس شراء بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    استخدم عكس الشراء لتصحيح الكمية الزائدة المقيدة على فاتورة موجودة.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {corrections.map((correction, idx) => (
          <PurchaseCorrectionCard key={correction.id} correction={correction} idx={idx} />
        ))}
        {corrections.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد عمليات عكس شراء بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              استخدم عكس الشراء لتصحيح الكمية الزائدة المقيدة على فاتورة موجودة.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
