import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
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
  return purchase.supplierName ?? `مورد محفوظ #${purchase.supplierId}`;
}

export function IngredientPurchasesTable({ purchases }: IngredientPurchasesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-center">الكود</TableHead>
            <TableHead className="text-center">المورد</TableHead>
            <TableHead className="text-center">عدد البنود</TableHead>
            <TableHead className="text-center">إجمالي الفاتورة</TableHead>
            <TableHead className="text-center">وقت الفاتورة</TableHead>
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
              </TableRow>
            );
          })}

          {purchases.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-20 text-center">
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
  );
}
