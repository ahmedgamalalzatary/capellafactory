import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-28 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[13px] leading-relaxed text-[var(--ink)] placeholder:text-[var(--muted-soft)] outline-none transition-colors hover:border-[var(--muted)] ${className}`}
      {...props}
    />
  );
}
