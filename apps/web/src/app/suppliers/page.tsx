import { getSuppliers } from "@/api-client/suppliers";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

function Stat({
  code,
  label,
  value,
  hint,
}: {
  code: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="relative px-6 py-5 border-r border-[var(--line)] last:border-r-0 bg-[var(--paper)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          {label}
        </p>
        <span className="font-mono text-[10px] text-[var(--muted-soft)]">{code}</span>
      </div>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
      {hint ? (
        <p className="mt-2 text-[11px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  const total = suppliers.length;
  const withLocation = suppliers.filter((s) => Boolean(s.where)).length;
  const lettersFirst = suppliers[0]?.name?.[0]?.toUpperCase() ?? "—";

  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <section className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              <span className="inline-block h-px w-8 bg-[var(--ink)]" />
              Module 01 · Suppliers
            </div>
            <h1 className="mt-5 font-display text-[64px] leading-[0.95] tracking-[-0.01em]">
              Supplier <span className="italic">registry</span>
              <span className="text-[var(--muted-soft)]">.</span>
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--muted)] max-w-[58ch]">
              The canonical list of partners feeding the factory floor. Maintain
              contact details, locations and operational notes — required across
              purchasing, receiving and accounting flows.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 pt-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              {new Date().toISOString().slice(0, 10)} · view all
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 px-4 border border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink)] text-[13px] transition-colors"
              >
                Export · CSV
              </button>
              <SupplierDialog />
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--line)]">
          <Stat
            code="K.01"
            label="Total suppliers"
            value={String(total).padStart(2, "0")}
            hint="Active records in registry"
          />
          <Stat
            code="K.02"
            label="With location"
            value={String(withLocation).padStart(2, "0")}
            hint={`${total ? Math.round((withLocation / total) * 100) : 0}% have a 'where' field`}
          />
          <Stat
            code="K.03"
            label="Pending sync"
            value="00"
            hint="No outstanding writes"
          />
          <Stat
            code="K.04"
            label="Alphabet · head"
            value={lettersFirst}
            hint="First entry in current sort"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border border-[var(--line)] bg-[var(--paper)] px-4 h-12">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            <span className="inline-block h-1.5 w-1.5 bg-[var(--ink)]" /> registry
          </div>
          <span className="h-4 w-px bg-[var(--line)]" />
          <button className="font-mono text-[11px] uppercase tracking-[0.18em] hover:text-[var(--ink)] text-[var(--ink)]">
            All <span className="text-[var(--muted)]">· {total}</span>
          </button>
          <button className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--ink)]">
            Located <span className="opacity-60">· {withLocation}</span>
          </button>
          <button className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--ink)]">
            Recent
          </button>
          <span className="h-4 w-px bg-[var(--line)]" />
          <button className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--ink)]">
            ⇅ Sort · name
          </button>
          <button className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--ink)]">
            ☰ Columns
          </button>
          <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            {total} rows · page 1
          </div>
        </div>

        {/* Table card */}
        <section className="border border-[var(--line)] bg-[var(--paper)]">
          <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Records · 01
              </p>
              <h2 className="font-display text-2xl mt-1">Suppliers list</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              <span>name · phone · where · notes</span>
            </div>
          </header>
          <div className="p-2">
            <SuppliersTable suppliers={suppliers} />
          </div>
          <footer className="flex items-center justify-between px-6 py-3 border-t border-[var(--line)] font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            <span>showing 1–{total} of {total}</span>
            <span className="flex items-center gap-2">
              <button className="px-2 py-1 border border-[var(--line-strong)] hover:border-[var(--ink)]">←</button>
              <span>01 / 01</span>
              <button className="px-2 py-1 border border-[var(--line-strong)] hover:border-[var(--ink)]">→</button>
            </span>
          </footer>
        </section>
      </section>
    </div>
  );
}
