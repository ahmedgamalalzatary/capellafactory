import type { HTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`border border-[var(--line)] bg-[var(--paper)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={`flex items-center justify-between border-b border-[var(--line)] px-6 py-4 ${className}`}
    >
      {children}
    </header>
  );
}

export function CardTitle({
  children,
  className = "",
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`font-display text-2xl leading-tight tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function CardContent({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
