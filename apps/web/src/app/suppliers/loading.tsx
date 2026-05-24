export default function SuppliersLoading() {
  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-16 bg-secondary animate-pulse rounded" />
        <div className="h-3 w-2 bg-secondary animate-pulse rounded" />
        <div className="h-3 w-16 bg-secondary animate-pulse rounded" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-7 w-36 bg-secondary animate-pulse rounded mb-2" />
        <div className="h-3 w-72 bg-secondary animate-pulse rounded" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-5 py-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="h-3 w-24 bg-secondary animate-pulse rounded mb-3" />
            <div className="h-7 w-12 bg-secondary animate-pulse rounded mb-1" />
            <div className="h-2.5 w-16 bg-secondary animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Toolbar + table skeleton */}
      <div
        className="px-4 py-3 mb-0"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      >
        <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
      </div>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-[40px_1.5fr_1fr_1fr_2fr_40px] gap-4 items-center"
            style={{
              background: i % 2 === 1 ? "var(--secondary)" : "var(--background)",
              borderBottom: i < 5 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="h-3 w-5 bg-secondary animate-pulse rounded" />
            <div className="h-3 w-28 bg-secondary animate-pulse rounded" />
            <div className="h-3 w-24 bg-secondary animate-pulse rounded" />
            <div className="h-3 w-16 bg-secondary animate-pulse rounded" />
            <div className="h-3 w-full bg-secondary animate-pulse rounded" />
            <div className="h-6 w-6 bg-secondary animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
