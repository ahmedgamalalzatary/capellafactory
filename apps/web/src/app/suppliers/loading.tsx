export default function SuppliersLoading() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
        <span className="inline-block h-px w-8 bg-[var(--ink)]" />
        Module 01 · Suppliers
      </div>
      <h1 className="mt-5 font-display text-[64px] leading-[0.95] tracking-[-0.01em]">
        Supplier <span className="italic">registry</span>
        <span className="text-[var(--muted-soft)]">.</span>
      </h1>

      <div className="mt-10 border border-[var(--line)] bg-[var(--paper)]">
        <div className="grid grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-5 border-r border-[var(--line)] last:border-r-0">
              <div className="h-3 w-24 bg-[var(--chalk)] animate-pulse" />
              <div className="mt-4 h-8 w-16 bg-[var(--chalk)] animate-pulse" />
              <div className="mt-3 h-3 w-32 bg-[var(--chalk)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border border-[var(--line)] bg-[var(--paper)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="h-5 w-40 bg-[var(--chalk)] animate-pulse" />
          <div className="h-3 w-24 bg-[var(--chalk)] animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--line)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-[40px_1.5fr_1fr_1fr_2fr_120px] gap-4 items-center">
              <div className="h-3 w-6 bg-[var(--chalk)] animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-[var(--chalk)] animate-pulse" />
                <div className="h-3 w-32 bg-[var(--chalk)] animate-pulse" />
              </div>
              <div className="h-3 w-24 bg-[var(--chalk)] animate-pulse" />
              <div className="h-3 w-20 bg-[var(--chalk)] animate-pulse" />
              <div className="h-3 w-full bg-[var(--chalk)] animate-pulse" />
              <div className="h-7 w-full bg-[var(--chalk)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        <span className="inline-block h-1.5 w-1.5 bg-[var(--ink)] animate-pulse mr-2" />
        loading registry · please wait
      </p>
    </div>
  );
}
