import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export function Dialog({ children }: { children: ReactNode }) {
  return <div className="contents">{children}</div>;
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
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 grid gap-2 ${className}`}>{children}</div>;
}

export function DialogTitle({
  children,
  className = "",
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>;
}

export function DialogDescription({
  children,
  className = "",
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-[var(--muted)] ${className}`}>{children}</p>;
}
