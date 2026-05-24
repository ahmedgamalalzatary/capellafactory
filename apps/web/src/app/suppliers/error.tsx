"use client";

export default function SuppliersError() {
  return (
    <div className="px-8 py-10">
      <div className="max-w-2xl border border-[var(--ink)] bg-[var(--paper)] shadow-[8px_8px_0_0_var(--ink)]">
        <div className="h-1 bg-[var(--ink)]" />
        <div className="p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Error · E.503
          </p>
          <h1 className="mt-3 font-display text-5xl leading-tight tracking-tight">
            Registry <span className="italic">unreachable</span>.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--muted)] max-w-prose">
            Failed to load suppliers. The API did not respond, or the database
            connection is currently unavailable. Check that the backend service
            is running and that the MySQL instance is reachable from this
            environment.
          </p>

          <div className="mt-6 border border-[var(--line)] bg-[var(--bone)] p-4 font-mono text-[12px] leading-relaxed">
            <p className="text-[var(--muted)]">// diagnostic</p>
            <p>GET /api/v1/suppliers <span className="text-[var(--muted)]">— failed</span></p>
            <p className="text-[var(--muted)]">retry · check · escalate</p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-10 px-4 bg-[var(--ink)] text-[var(--paper)] text-[13px]"
            >
              Retry connection
            </button>
            <a
              href="/"
              className="h-10 px-4 border border-[var(--line-strong)] hover:border-[var(--ink)] text-[13px] inline-flex items-center transition-colors"
            >
              Back to overview
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
