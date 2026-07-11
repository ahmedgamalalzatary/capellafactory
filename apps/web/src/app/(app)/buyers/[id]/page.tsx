import { notFound } from "next/navigation";
import { AccountInvoicesTable } from "@/components/accounts/account-invoices-table";
import { getBuyer } from "@/lib/api/buyers";
import { getSalesInvoices } from "@/lib/api/sales-invoices";
import { getServerCookieHeader } from "@/lib/server-cookies";

type BuyerAccountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuyerAccountPage({ params }: BuyerAccountPageProps) {
  const buyerId = Number((await params).id);

  if (!Number.isInteger(buyerId) || buyerId <= 0) {
    notFound();
  }

  const cookieHeader = await getServerCookieHeader();
  const [buyer, invoices] = await Promise.all([
    getBuyer(buyerId, { cookieHeader }),
    getSalesInvoices(undefined, { cookieHeader, buyerId }),
  ]);

  if (!buyer) {
    notFound();
  }

  return (
    <AccountInvoicesTable
      title={buyer.name}
      summaryLabel="إجمالي المستحق من المشتري"
      invoices={invoices.map((invoice) => ({
          id: invoice.id,
          invoiceCode: invoice.invoiceCode,
          occurredAt: invoice.occurredAt,
          totalAmount: invoice.finalTotal,
          paidAmount: invoice.paidAmount,
          remainingAmount: invoice.remainingAmount,
          paymentStatus: invoice.paymentStatus,
          href: `/sales/${invoice.id}`,
        }))}
    />
  );
}
