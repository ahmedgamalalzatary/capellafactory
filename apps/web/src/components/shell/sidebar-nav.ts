export type SidebarItem = {
  label: string;
  href: string;
};

export const sidebarItems: readonly SidebarItem[] = [
  { label: "الموردون", href: "/suppliers" },
  { label: "المشترون", href: "/buyers" },
  { label: "المخزون", href: "/inventory" },
  { label: "المشتريات", href: "/purchases" },
  { label: "التصنيع", href: "/products" },
  { label: "المبيعات", href: "/sales" },
  { label: "التقارير", href: "/reports" },
] as const;

export function isSidebarItemActive(item: SidebarItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
