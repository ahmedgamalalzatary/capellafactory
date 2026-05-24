import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-28 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none ${className}`}
      {...props}
    />
  );
}
