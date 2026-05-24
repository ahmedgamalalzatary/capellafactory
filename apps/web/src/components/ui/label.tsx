import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] ${className}`}
      {...props}
    />
  );
}
