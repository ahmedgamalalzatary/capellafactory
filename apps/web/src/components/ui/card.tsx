import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <header className={`border-b border-[var(--border)] p-6 ${className}`}>{children}</header>;
}

export function CardTitle({
  children,
  className = "",
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-2xl font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
