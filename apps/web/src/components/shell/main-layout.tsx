import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SidebarView } from "./sidebar-view";
import { MobileTopBar } from "./mobile-top-bar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SidebarView />
      <div className="flex min-h-screen flex-col md:[margin-inline-start:var(--sidebar-w)]">
        <MobileTopBar />
        <main className="relative z-0 flex-1" style={{ background: "var(--background)" }}>
          {children}
        </main>
      </div>
      <Toaster position="top-left" richColors />
    </div>
  );
}
