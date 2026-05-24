import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-[13px] text-[var(--ink)] placeholder:text-[var(--muted-soft)] outline-none transition-colors hover:border-[var(--muted)] ${className}`}
      {...props}
    />
  );
}
