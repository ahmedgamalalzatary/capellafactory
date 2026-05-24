import { getSuppliers } from "@/api-client/suppliers";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  const total = suppliers.length;
  const withLocation = suppliers.filter((s) => Boolean(s.where)).length;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-6 mb-8">
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "إجمالي الموردين",
            value: String(total),
            sub: "موردون مسجّلون",
          },
          {
            label: "لديهم موقع",
            value: String(withLocation),
            sub: `من أصل ${total}`,
          },
          {
            label: "في انتظار المزامنة",
            value: "0",
            sub: "لا يوجد",
          },
          {
            label: "آخر تحديث",
            value: new Date().toLocaleDateString("ar-EG", {
              day: "numeric",
              month: "short",
            }),
            sub: new Date().toLocaleDateString("ar-EG", { year: "numeric" }),
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-card px-5 py-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p className="text-[11px] text-muted-foreground font-medium mb-3 tracking-wide">
              {kpi.label}
            </p>
            <p className="text-[28px] font-bold text-foreground leading-none mb-1">
              {kpi.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
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
        <input
          type="search"
          placeholder="بحث في الموردين…"
          className="h-8 w-56 border border-border bg-secondary px-3 text-[13px] placeholder:text-muted-foreground outline-none focus:border-foreground transition-colors"
          style={{ borderRadius: "var(--radius-sm)" }}
        />
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
