import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { label: "الموردون", href: "/suppliers", active: true },
  { label: "المخزون",   soon: true },
  { label: "المشتريات", soon: true },
  { label: "المبيعات",  soon: true },
  { label: "المحاسبة",  soon: true },
  { label: "التقارير",  soon: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>

      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 z-40 flex flex-col"
        style={{
          insetInlineStart: 0,
          width: "var(--sidebar-w)",
          background: "var(--sidebar)",
          borderInlineEnd: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex-shrink-0 px-6 py-6"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <div
            className="text-[20px] font-bold leading-none tracking-tight"
            style={{ color: "var(--sidebar-foreground)" }}
          >
            كابيلا
          </div>
          <div
            className="text-[11px] font-normal mt-1.5 leading-none"
            style={{ color: "var(--sidebar-muted)" }}
          >
            نظام تخطيط الموارد
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-4">
          <p
            className="text-[10px] font-semibold px-3 mb-3 tracking-widest uppercase"
            style={{ color: "var(--sidebar-muted)" }}
          >
            الوحدات
          </p>

          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const isActive = "active" in item && item.active;

              if (isActive) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center px-3 h-10 text-[13px] font-semibold transition-colors rounded-sm"
                    style={{
                      color: "var(--sidebar-foreground)",
                      background: "var(--sidebar-accent)",
                      borderInlineEnd: "2px solid var(--sidebar-foreground)",
                    }}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <div
                  key={item.label}
                  className="flex items-center px-3 h-10 text-[13px] opacity-40 cursor-default rounded-sm"
                  style={{
                    color: "var(--sidebar-foreground)",
                    borderInlineEnd: "2px solid transparent",
                  }}
                >
                  <span className="flex-1">{item.label}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 leading-none font-medium rounded-xs"
                    style={{
                      border: "1px solid var(--sidebar-muted)",
                      color: "var(--sidebar-muted)",
                    }}
                  >
                    قريبًا
                  </span>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main
        className="flex-1 min-h-screen"
        style={{
          marginInlineStart: "var(--sidebar-w)",
          background: "var(--background)",
        }}
      >
        {children}
      </main>

      <Toaster position="bottom-left" richColors />
    </div>
  );
}
