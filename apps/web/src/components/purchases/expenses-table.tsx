import { expenseTypeLabels } from "@capella/shared/expenses/expense.constants";
import type { Expense } from "@capella/shared/expenses/expense.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExpensesTableProps = {
  expenses: Expense[];
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

function expenseSubtitle(expense: Expense) {
  if (expense.type === "salary" && expense.employeeName) {
    return expense.employeeName;
  }

  if (expense.type === "other" && expense.otherLabel) {
    return expense.otherLabel;
  }

  return "مصروف عام";
}

function ExpenseCard({ expense, idx }: { expense: Expense; idx: number }) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {expenseTypeLabels[expense.type]}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{expenseSubtitle(expense)}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(expense.amount)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">وقت الدفع</dt>
        <dd className="text-foreground">{formatOccurredAt(expense.occurredAt)}</dd>
        <dt className="text-muted-foreground">ملاحظات</dt>
        <dd className="text-foreground">{expense.notes ?? "لا توجد"}</dd>
      </dl>
    </div>
  );
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="text-center">النوع</TableHead>
              <TableHead className="text-center">التفصيل</TableHead>
              <TableHead className="text-center">المبلغ</TableHead>
              <TableHead className="text-center">وقت الدفع</TableHead>
              <TableHead className="text-center">ملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, idx) => (
              <TableRow key={expense.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {expenseTypeLabels[expense.type]}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {expenseSubtitle(expense)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatAmount(expense.amount)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatOccurredAt(expense.occurredAt)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {expense.notes ?? "لا توجد"}
                </TableCell>
              </TableRow>
            ))}

            {expenses.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-20 text-center">
                  <p className="text-sm font-medium">لا توجد مصروفات بعد</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    ابدأ بتسجيل أول مصروف تشغيلي من شاشة المشتريات.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y sm:hidden" style={{ background: "var(--card)" }}>
        {expenses.map((expense, idx) => (
          <ExpenseCard key={expense.id} expense={expense} idx={idx} />
        ))}
        {expenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">لا توجد مصروفات بعد</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ابدأ بتسجيل أول مصروف تشغيلي من شاشة المشتريات.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
