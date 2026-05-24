"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarView } from "./sidebar-view";
import { sidebarItems } from "./sidebar-nav";

function resolveTitle(pathname: string): string {
  const match = sidebarItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? "كابيلا";
}

export function MobileTopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const title = resolveTitle(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4 md:hidden"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="فتح القائمة"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[280px] gap-0 border-0 p-0 sm:max-w-[280px]"
          style={{ background: "var(--sidebar)" }}
        >
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SheetDescription className="sr-only">
            روابط الوحدات الأساسية للنظام
          </SheetDescription>
          <SidebarView variant="drawer" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
    </header>
  );
}
