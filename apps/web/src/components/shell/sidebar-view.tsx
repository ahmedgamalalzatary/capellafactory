"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { isSidebarItemActive, sidebarItems } from "./sidebar-nav";

type SidebarViewProps = {
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
};

export function SidebarView({
  variant = "desktop",
  onNavigate,
}: SidebarViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDrawer = variant === "drawer";

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      onNavigate?.();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل تسجيل الخروج. حاول مجددًا.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const asideClass = isDrawer
    ? "flex h-full w-full flex-col"
    : "fixed inset-y-0 z-40 hidden flex-col md:flex";

  const asideStyle = isDrawer
    ? {
      background: "var(--sidebar)",
    }
    : {
      insetInlineStart: 0,
      width: "var(--sidebar-w)",
      background: "var(--sidebar)",
      borderInlineEnd: "1px solid var(--sidebar-border)",
    };

  return (
    <aside className={asideClass} style={asideStyle}>
      <div
        className="shrink-0 px-6 py-6"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link
          href="/suppliers"
          onClick={onNavigate}
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
                onClick={onNavigate}
                className="flex h-10 items-center rounded-sm px-3 text-[13px] font-semibold transition-colors"
                style={{
                  color: "var(--sidebar-foreground)",
                  background: isActive
                    ? "var(--sidebar-accent)"
                    : "transparent",
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

      <div
        className="border-t px-3 py-4"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
        </Button>
      </div>
    </aside>
  );
}
