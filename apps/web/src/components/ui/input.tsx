import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none ${className}`}
      {...props}
    />
  );
}
