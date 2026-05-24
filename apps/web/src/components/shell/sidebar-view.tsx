"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  label: string;
  href: string;
};

export const sidebarItems: readonly SidebarItem[] = [
  { label: "الموردون", href: "/suppliers" },
  { label: "المخزون", href: "/inventory" },
  { label: "المشتريات", href: "/purchases" },
  { label: "المبيعات", href: "/sales" },
  { label: "المشترون", href: "/buyers" },
  { label: "التقارير", href: "/reports" },
] as const;

export function isSidebarItemActive(item: SidebarItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SidebarView() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 z-50 flex flex-col"
      style={{
        insetInlineStart: 0,
        width: "var(--sidebar-w)",
        background: "var(--sidebar)",
        borderInlineEnd: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        className="flex-shrink-0 px-6 py-6"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link
          href="/suppliers"
          className="text-[20px] font-bold leading-none tracking-tight"
          style={{ color: "var(--sidebar-foreground)" }}
        >
          كابيلا
        </Link>
        <div
          className="mt-1.5 text-[11px] font-normal leading-none"
          style={{ color: "var(--sidebar-muted)" }}
        >
          نظام تخطيط الموارد
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-4">
        <p
          className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--sidebar-muted)" }}
        >
          الوحدات
        </p>

        <div className="flex flex-col gap-0.5">
          {sidebarItems.map((item) => {
            const isActive = isSidebarItemActive(item, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 items-center rounded-sm px-3 text-[13px] font-semibold transition-colors"
                style={{
                  color: "var(--sidebar-foreground)",
                  background: isActive ? "var(--sidebar-accent)" : "transparent",
                  borderInlineEnd: isActive
                    ? "2px solid var(--sidebar-foreground)"
                    : "2px solid transparent",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
