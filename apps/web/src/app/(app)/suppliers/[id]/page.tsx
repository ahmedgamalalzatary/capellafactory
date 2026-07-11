import { notFound } from "next/navigation";
import { AccountInvoicesTable } from "@/components/accounts/account-invoices-table";
import { getIngredientPurchases } from "@/lib/api/ingredient-purchases";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { getSupplier } from "@/lib/api/suppliers";

type SupplierAccountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplierAccountPage({ params }: SupplierAccountPageProps) {
  const supplierId = Number((await params).id);

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    notFound();
  }

  const cookieHeader = await getServerCookieHeader();
  const [supplier, purchases] = await Promise.all([
    getSupplier(supplierId, { cookieHeader }),
    getIngredientPurchases(undefined, { cookieHeader, supplierId }),
  ]);

  if (!supplier) {
    notFound();
  }

  return (
    <AccountInvoicesTable
      title={supplier.name}
      summaryLabel="إجمالي المستحق للمورد"
      invoices={purchases.map((purchase) => ({
          id: purchase.id,
          invoiceCode: purchase.invoiceCode,
          occurredAt: purchase.occurredAt,
          totalAmount: purchase.finalTotal,
          paidAmount: purchase.paidAmount,
          remainingAmount: purchase.remainingAmount,
          paymentStatus: purchase.paymentStatus,
          href: `/purchases/ingredient-purchases/${purchase.id}`,
        }))}
    />
  );
}
