import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "outline" | "destructive";
};

const variantClassName: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent",
  outline: "bg-transparent text-[var(--foreground)] border-[var(--border)]",
  destructive: "bg-red-700 text-white border-transparent",
};

export function Button({
  children,
  className = "",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:opacity-90 ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
