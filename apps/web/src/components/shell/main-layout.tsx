import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SidebarView } from "./sidebar-view";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <SidebarView />
      <main
        className="relative z-0 min-h-screen flex-1"
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
