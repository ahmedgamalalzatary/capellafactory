import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md";
};

const variantClassName: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] hover:bg-[var(--ink-soft)]",
  outline:
    "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-strong)] hover:border-[var(--ink)]",
  destructive:
    "bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]",
  ghost:
    "bg-transparent text-[var(--ink)] border-transparent hover:bg-[var(--chalk)]",
};

const sizeClassName: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-10 px-4 text-[13px]",
};

export function Button({
  children,
  className = "",
  type = "button",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border font-medium tracking-tight transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none ${sizeClassName[size]} ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
