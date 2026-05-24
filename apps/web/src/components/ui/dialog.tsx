import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export function Dialog({
  children,
  open = true,
}: {
  children: ReactNode;
  open?: boolean;
}) {
  return open ? <div className="contents">{children}</div> : null;
}

export function DialogTrigger({
  children,
}: {
  children: ReactElement;
  asChild?: boolean;
}) {
  return children;
}

export function DialogContent({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative w-full max-w-lg border border-[var(--ink)] bg-[var(--paper)] shadow-[8px_8px_0_0_var(--ink)] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--ink)]" />
      <div className="p-6">{children}</div>
    </div>
  );
}

export function DialogHeader({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-6 grid gap-2 border-b border-[var(--line)] pb-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = "",
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-3xl leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function DialogDescription({
  children,
  className = "",
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[13px] text-[var(--muted)] leading-relaxed ${className}`}>
      {children}
    </p>
  );
}
