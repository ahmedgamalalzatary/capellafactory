import { getSuppliers } from "@/lib/api/suppliers";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { SuppliersSearchInput } from "@/components/suppliers/suppliers-search-input";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

type SuppliersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const cookieHeader = await getServerCookieHeader();
  const suppliers = await getSuppliers(query, { cookieHeader });

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
            الموردون
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[48ch]">
            إدارة بيانات الموردين: الاسم، رقم الهاتف، الموقع، والملاحظات التشغيلية.
          </p>
        </div>
        <div className="flex-shrink-0 pt-1">
          <SupplierDialog />
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-2.5 px-4 py-3 mb-0"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      >
        <SuppliersSearchInput initialQuery={query} />
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <SuppliersTable suppliers={suppliers} />
      </div>

    </div>
  );
}
